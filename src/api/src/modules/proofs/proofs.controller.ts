import { Controller, Post, Get, Param, Body, UseGuards, BadRequestException, ConflictException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { BannedUserGuard } from '../../guards/banned-user.guard';
import { GeofenceGuard } from '../../common/guards/geofence.guard';
import { ComplianceAccessGuard } from '../../common/guards/compliance-access.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { R2StorageService } from '../../../services/storage/r2.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PHashService } from '../../../services/intelligence/phash.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { RequestUploadUrlDto, ConfirmUploadDto } from './dto';
import { ProofsService } from './proofs.service';

@ApiTags('Proofs')
@ApiBearerAuth()
@Controller('proofs')
export class ProofsController {
  constructor(
    private readonly pool: Pool,
    private readonly r2: R2StorageService,
    private readonly furyRouter: FuryRouterService,
    private readonly truthLog: TruthLogService,
    private readonly phash: PHashService,
    private readonly anomaly: AnomalyService,
    private readonly proofsService: ProofsService,
  ) {}

  @UseGuards(AuthGuard, GeofenceGuard, ComplianceAccessGuard, BannedUserGuard)
  @Post('upload-url')
  @ApiOperation({ summary: 'Request a pre-signed R2 upload URL for proof media' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async requestUploadUrl(
    @CurrentUser() user: { id: string },
    @Body() dto: RequestUploadUrlDto,
  ) {
    const contractAccess = await this.proofsService.getProofUploadContractAccess(dto.contractId, {
      userId: user.id,
    });

    if (contractAccess.status !== 'ACTIVE') {
      throw new BadRequestException('Proof submission is only allowed for active contracts');
    }

    const proofResult = await this.pool.query(
      `INSERT INTO proofs (contract_id, user_id, status, content_type, description, submitted_at)
       VALUES ($1, $2, 'PENDING_UPLOAD', $3, $4, NOW())
       RETURNING id`,
      [dto.contractId, contractAccess.ownerUserId, dto.contentType, dto.description || null],
    );

    const proofId = proofResult.rows[0].id;
    const { uploadUrl, key } = await this.r2.generateUploadUrl(proofId, dto.contentType);

    await this.truthLog.appendEvent('PROOF_UPLOAD_REQUESTED', {
      proofId,
      contractId: dto.contractId,
      userId: contractAccess.ownerUserId,
      contentType: dto.contentType,
    });

    return { proofId, uploadUrl, storageKey: key, expiresInSeconds: 300 };
  }

  @UseGuards(AuthGuard, GeofenceGuard, ComplianceAccessGuard, BannedUserGuard)
  @Post(':id/confirm-upload')
  @ApiOperation({ summary: 'Confirm that proof media has been uploaded to R2' })
  async confirmUpload(
    @Param('id') proofId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ConfirmUploadDto,
  ) {
    const proofAccess = await this.proofsService.getProofUploadConfirmationAccess(proofId, {
      userId: user.id,
    });

    if (proofAccess.status !== 'PENDING_UPLOAD') {
      throw new BadRequestException(`Proof is in state '${proofAccess.status}', expected 'PENDING_UPLOAD'`);
    }

    // TKT-P0-002: Native Camera Proof Integrity
    const mediaBuffer = await this.r2.downloadFile(dto.storageKey);
    
    // 1. Anomaly & Sensory Integrity Check
    const anomalyResult = await this.anomaly.analyze(mediaBuffer, user.id, dto.storageKey);
    const combinedFlags = [...(anomalyResult.flags || [])];

    // 2. pHash Duplicate Detection
    let isDuplicate = false;
    try {
      const frameHash = await this.phash.computeFrameHash(mediaBuffer);
      const existingHashes = await this.pool.query(
        'SELECT phash FROM proof_hashes WHERE proof_id != $1',
        [proofId],
      );
      const hashStrings = existingHashes.rows.map((r: any) => r.phash);
      const { duplicate } = await this.phash.isDuplicate(mediaBuffer, hashStrings);
      
      if (duplicate) {
        isDuplicate = true;
        combinedFlags.push('PHASH_DUPLICATE');
      } else {
        await this.pool.query(
          'INSERT INTO proof_hashes (proof_id, phash) VALUES ($1, $2) ON CONFLICT (proof_id) DO NOTHING',
          [proofId, frameHash],
        );
      }
    } catch (e) {
      combinedFlags.push('PHASH_PROCESSING_ERROR');
    }

    if (isDuplicate) {
      await this.pool.query("UPDATE proofs SET status = 'REJECTED' WHERE id = $1", [proofId]);
      throw new ConflictException('Duplicate proof detected. Submission rejected.');
    }

    // 3. Finalize Proof with Biometric + Anomaly Metadata
    await this.pool.query(
      `UPDATE proofs
       SET status = 'PENDING_REVIEW', 
           media_uri = $1, 
           uploaded_at = NOW(),
           biometric_verified = $3,
           biometric_type = $4,
           anomaly_flags = $5,
           device_metadata = $6
       WHERE id = $2`,
      [
        dto.storageKey, 
        proofId, 
        dto.biometricVerified || false, 
        dto.biometricType || null, 
        JSON.stringify(combinedFlags),
        JSON.stringify(dto.deviceMetadata || {})
      ],
    );

    const jobId = await this.furyRouter.routeProof(proofId, proofAccess.ownerUserId);

    await this.truthLog.appendEvent('PROOF_UPLOAD_CONFIRMED', {
      proofId,
      contractId: proofAccess.contractId,
      userId: proofAccess.ownerUserId,
      anomalyFlags: combinedFlags,
      biometricVerified: dto.biometricVerified,
    });

    return { proofId, status: 'PENDING_REVIEW', furyRouteJobId: jobId, flags: combinedFlags };
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get proof details with a signed view URL (for Fury auditors)' })
  async getProofDetail(
    @Param('id') proofId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.proofsService.getProofDetail(proofId, { userId: user.id });
  }

  @UseGuards(AuthGuard)
  @Get(':id/processing-status')
  @ApiOperation({ summary: 'Get video processing pipeline status' })
  async getProcessingStatus(
    @Param('id') proofId: string,
    @CurrentUser() user: { id: string },
  ) {
    const proofAccess = await this.proofsService.getProofUploadConfirmationAccess(proofId, {
      userId: user.id,
    });

    const jobs = await this.pool.query(
      'SELECT stage, status, error, updated_at FROM proof_processing_jobs WHERE proof_id = $1 ORDER BY created_at DESC',
      [proofId]
    );

    const proofInfo = await this.pool.query(
      'SELECT processing_status FROM proofs WHERE id = $1',
      [proofId]
    );

    return {
      proofId,
      overallStatus: proofInfo.rows[0]?.processing_status || 'NOT_STARTED',
      jobs: jobs.rows,
    };
  }

  @UseGuards(AuthGuard)
  @Post(':id/processing-complete')
  @ApiOperation({ summary: 'Internal callback for video processing completion' })
  async processingComplete(
    @Param('id') proofId: string,
    @Body() dto: { status: 'COMPLETED' | 'FAILED', error?: string, maskedMediaUri?: string },
  ) {
    // In production, this would be authenticated via service-to-service token
    await this.pool.query(
      `UPDATE proofs 
       SET processing_status = $1,
           masked_media_uri = COALESCE($2, masked_media_uri),
           redaction_status = CASE WHEN $2 IS NOT NULL THEN 'MASKED' ELSE redaction_status END
       WHERE id = $3`,
      [dto.status, dto.maskedMediaUri || null, proofId]
    );

    if (dto.status === 'COMPLETED') {
      // Check if it's ready for Fury routing (has challenge token etc)
      const proofResult = await this.pool.query('SELECT user_id, challenge_token FROM proofs WHERE id = $1', [proofId]);
      if (proofResult.rows.length > 0 && proofResult.rows[0].challenge_token) {
        // Need to wait until challenge token validation is implemented in the controller
      }
    }

    return { success: true };
  }
}
