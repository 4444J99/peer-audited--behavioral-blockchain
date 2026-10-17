import { Controller, Post, Get, Param, Body, Headers, UseGuards, BadRequestException, ConflictException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { timingSafeEqual } from 'crypto';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { BannedUserGuard } from '../../guards/banned-user.guard';
import { GeofenceGuard } from '../../common/guards/geofence.guard';
import { ComplianceAccessGuard } from '../../common/guards/compliance-access.guard';
import { CurrentUser, Public } from '../../common/decorators/current-user.decorator';
import { R2StorageService } from '../../../services/storage/r2.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PHashService } from '../../../services/intelligence/phash.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { NonceService } from '../../../services/nonce/nonce.service';
import { RequestUploadUrlDto, ConfirmUploadDto, ChallengeNonceDto } from './dto';
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
    private readonly nonceService: NonceService,
  ) {}

  @UseGuards(AuthGuard, GeofenceGuard, ComplianceAccessGuard, BannedUserGuard)
  @Post('challenge-nonce')
  @ApiOperation({ summary: 'Request a capture nonce for native camera proof integrity' })
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async requestChallengeNonce(
    @CurrentUser() user: { id: string },
    @Body() dto: ChallengeNonceDto,
  ) {
    const contractAccess = await this.proofsService.getProofUploadContractAccess(dto.contractId, {
      userId: user.id,
    });

    if (contractAccess.status !== 'ACTIVE') {
      throw new BadRequestException('Proof submission is only allowed for active contracts');
    }

    const { nonce, raw, expiresAt } = await this.nonceService.generateNonce(
      dto.contractId,
      user.id,
    );

    return { nonce, raw, expiresAt, ttlSeconds: 120 };
  }

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

    // Nonce verification: if a capture nonce was provided, verify it
    if (dto.captureNonce) {
      const nonceValid = await this.nonceService.verifyNonce(
        dto.captureNonce,
        proofAccess.contractId,
        proofAccess.ownerUserId,
      );
      if (!nonceValid) {
        throw new BadRequestException('Capture nonce verification failed — proof rejected');
      }
      await this.nonceService.consumeNonce(dto.captureNonce, proofId);
      await this.truthLog.appendEvent('PROOF_NONCE_VERIFIED', {
        proofId,
        contractId: proofAccess.contractId,
        userId: proofAccess.ownerUserId,
      });
    }

    const mediaBuffer = await this.r2.downloadFile(dto.storageKey);

    // 1. Anomaly & Sensory Integrity Check
    const anomalyResult = await this.anomaly.analyze(mediaBuffer, user.id, dto.storageKey);
    const combinedFlags = [...(anomalyResult.flags || [])];

    if (anomalyResult.rejected) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          "UPDATE proofs SET status = 'MANUAL_REVIEW', media_uri = $1, anomaly_flags = $3 WHERE id = $2",
          [dto.storageKey, proofId, JSON.stringify(combinedFlags)],
        );
        await this.truthLog.appendEvent(
          'PROOF_ANOMALY_REJECTED',
          {
            proofId,
            contractId: proofAccess.contractId,
            userId: proofAccess.ownerUserId,
            flags: combinedFlags,
            status: 'MANUAL_REVIEW',
          },
          client,
        );
        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }
      throw new BadRequestException(
        'Proof media failed integrity screening and has been held for manual review.',
      );
    }

    // 2. pHash Duplicate Detection
    let isDuplicate = false;
    let pHashFailed = false;
    try {
      const frameHash = await this.phash.computeFrameHash(mediaBuffer);
      const existingHashes = await this.pool.query(
        `SELECT ph.phash
         FROM proof_hashes ph
         JOIN proofs p ON p.id = ph.proof_id
         WHERE p.user_id = $1 AND ph.proof_id != $2`,
        [proofAccess.ownerUserId, proofId],
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
      pHashFailed = true;
      combinedFlags.push('PHASH_PROCESSING_ERROR');
    }

    if (isDuplicate) {
      await this.pool.query("UPDATE proofs SET status = 'REJECTED' WHERE id = $1", [proofId]);
      throw new ConflictException('Duplicate proof detected. Submission rejected.');
    }

    if (pHashFailed) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          "UPDATE proofs SET status = 'MANUAL_REVIEW', media_uri = $1, anomaly_flags = $3 WHERE id = $2",
          [dto.storageKey, proofId, JSON.stringify(combinedFlags)],
        );
        await this.truthLog.appendEvent(
          'PROOF_DEDUP_FAILED',
          {
            proofId,
            contractId: proofAccess.contractId,
            userId: proofAccess.ownerUserId,
            flags: combinedFlags,
            status: 'MANUAL_REVIEW',
          },
          client,
        );
        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }
      throw new BadRequestException(
        'Proof media could not be processed for duplicate detection. Submission held for manual review.',
      );
    }

    // 3. Finalize Proof with Anomaly Metadata
    await this.pool.query(
      `UPDATE proofs
       SET status = 'PENDING_REVIEW',
           media_uri = $1,
           uploaded_at = NOW(),
           anomaly_flags = $3,
           device_metadata = $4
       WHERE id = $2`,
      [
        dto.storageKey,
        proofId,
        JSON.stringify(combinedFlags),
        JSON.stringify(dto.deviceMetadata || {}),
      ],
    );

    const jobId = await this.furyRouter.routeProof(proofId, proofAccess.ownerUserId);

    await this.truthLog.appendEvent('PROOF_UPLOAD_CONFIRMED', {
      proofId,
      contractId: proofAccess.contractId,
      userId: proofAccess.ownerUserId,
      anomalyFlags: combinedFlags,
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

  @Public()
  @Post(':id/processing-complete')
  @ApiOperation({ summary: 'Internal callback for video processing completion' })
  async processingComplete(
    @Param('id') proofId: string,
    @Headers('x-internal-token') internalToken: string | undefined,
    @Headers('x-proof-challenge') proofChallenge: string | undefined,
    @Body() dto: { status: 'COMPLETED' | 'FAILED', error?: string, maskedMediaUri?: string },
  ) {
    this.assertInternalCaller(internalToken);

    const proofResult = await this.pool.query(
      'SELECT user_id, challenge_token, processing_status FROM proofs WHERE id = $1',
      [proofId],
    );
    if (proofResult.rows.length === 0) {
      throw new BadRequestException('Unknown proof for processing callback');
    }
    const { challenge_token: expectedChallenge, processing_status: currentProcessingStatus } =
      proofResult.rows[0];

    if (!expectedChallenge) {
      throw new ForbiddenException('Proof is not awaiting a processing callback');
    }
    if (
      currentProcessingStatus !== 'IN_PROGRESS' &&
      currentProcessingStatus !== 'PENDING' &&
      currentProcessingStatus !== 'PROCESSING'
    ) {
      throw new ConflictException(
        `Proof processing is not in-flight (status '${currentProcessingStatus}')`,
      );
    }
    this.assertProofChallenge(proofChallenge, expectedChallenge);

    await this.pool.query(
      `UPDATE proofs
       SET processing_status = $1,
           masked_media_uri = COALESCE($2, masked_media_uri),
           redaction_status = CASE WHEN $2 IS NOT NULL THEN 'MASKED' ELSE redaction_status END,
           challenge_token = NULL
       WHERE id = $3`,
      [dto.status, dto.maskedMediaUri || null, proofId]
    );

    return { success: true };
  }

  private assertInternalCaller(presentedToken: string | undefined): void {
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (!expected) {
      throw new ServiceUnavailableException('Internal callback endpoint is not configured');
    }
    if (!presentedToken) {
      throw new ForbiddenException('Missing internal service token');
    }

    const presentedBuf = Buffer.from(presentedToken);
    const expectedBuf = Buffer.from(expected);
    if (presentedBuf.length !== expectedBuf.length || !timingSafeEqual(presentedBuf, expectedBuf)) {
      throw new ForbiddenException('Invalid internal service token');
    }
  }

  private assertProofChallenge(presented: string | undefined, expected: string): void {
    if (!presented) {
      throw new ForbiddenException('Missing per-proof challenge token');
    }
    const presentedBuf = Buffer.from(presented);
    const expectedBuf = Buffer.from(expected);
    if (presentedBuf.length !== expectedBuf.length || !timingSafeEqual(presentedBuf, expectedBuf)) {
      throw new ForbiddenException('Invalid per-proof challenge token');
    }
  }
}
