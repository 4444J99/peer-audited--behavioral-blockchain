import { Controller, Post, Get, Param, Body, UseGuards, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { BannedUserGuard } from '../../guards/banned-user.guard';
import { GeofenceGuard } from '../../common/guards/geofence.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { R2StorageService } from '../../../services/storage/r2.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PHashService } from '../../../services/intelligence/phash.service';
import { RequestUploadUrlDto, ConfirmUploadDto } from './dto';

/**
 * ProofsController — Handles the proof media upload lifecycle.
 *
 * Flow:
 *   1. Client requests a pre-signed upload URL via POST /proofs/upload-url
 *   2. Client uploads media directly to R2 using the signed URL
 *   3. Client confirms upload via POST /proofs/:id/confirm-upload
 *   4. Proof transitions to PENDING_REVIEW → FuryRouterService enqueues routing
 *   5. Fury auditors retrieve proof details with signed view URLs via GET /proofs/:id
 */
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
  ) {}

  @UseGuards(GeofenceGuard, AuthGuard, BannedUserGuard)
  @Post('upload-url')
  @ApiOperation({ summary: 'Request a pre-signed R2 upload URL for proof media' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async requestUploadUrl(
    @CurrentUser() user: { id: string },
    @Body() dto: RequestUploadUrlDto,
  ) {
    // Verify the contract exists and belongs to the user
    const contract = await this.pool.query(
      `SELECT id, status FROM contracts WHERE id = $1 AND user_id = $2`,
      [dto.contractId, user.id],
    );

    if (contract.rows.length === 0) {
      throw new NotFoundException('Contract not found or does not belong to user');
    }

    if (contract.rows[0].status !== 'ACTIVE') {
      throw new BadRequestException('Proof submission is only allowed for active contracts');
    }

    // Create a pending proof row
    const proofResult = await this.pool.query(
      `INSERT INTO proofs (contract_id, user_id, status, content_type, description, submitted_at)
       VALUES ($1, $2, 'PENDING_UPLOAD', $3, $4, NOW())
       RETURNING id`,
      [dto.contractId, user.id, dto.contentType, dto.description || null],
    );

    const proofId = proofResult.rows[0].id;

    // Generate pre-signed upload URL
    const { uploadUrl, key } = await this.r2.generateUploadUrl(proofId, dto.contentType);

    await this.truthLog.appendEvent('PROOF_UPLOAD_REQUESTED', {
      proofId,
      contractId: dto.contractId,
      userId: user.id,
      contentType: dto.contentType,
    });

    return {
      proofId,
      uploadUrl,
      storageKey: key,
      expiresInSeconds: 300,
    };
  }

  @UseGuards(GeofenceGuard, AuthGuard, BannedUserGuard)
  @Post(':id/confirm-upload')
  @ApiOperation({ summary: 'Confirm that proof media has been uploaded to R2' })
  async confirmUpload(
    @Param('id') proofId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ConfirmUploadDto,
  ) {
    // Verify the proof exists, belongs to the user, and is in PENDING_UPLOAD state
    const proof = await this.pool.query(
      `SELECT id, contract_id, status FROM proofs
       WHERE id = $1 AND user_id = $2`,
      [proofId, user.id],
    );

    if (proof.rows.length === 0) {
      throw new NotFoundException('Proof not found or does not belong to user');
    }

    if (proof.rows[0].status !== 'PENDING_UPLOAD') {
      throw new BadRequestException(`Proof is in state '${proof.rows[0].status}', expected 'PENDING_UPLOAD'`);
    }

    // Transition proof to PENDING_REVIEW and store the R2 key
    await this.pool.query(
      `UPDATE proofs
       SET status = 'PENDING_REVIEW', media_uri = $1, uploaded_at = NOW()
       WHERE id = $2`,
      [dto.storageKey, proofId],
    );

    // pHash deduplication — download first frame, compute hash, check for twins
    try {
      const mediaBuffer = await this.r2.downloadFile(dto.storageKey);
      const frameHash = await this.phash.computeFrameHash(mediaBuffer);

      // Check against existing hashes
      const existingHashes = await this.pool.query(
        `SELECT phash FROM proof_hashes WHERE proof_id != $1`,
        [proofId],
      );

      const hashStrings = existingHashes.rows.map((r: any) => r.phash);
      const { duplicate, closestDistance } = await this.phash.isDuplicate(mediaBuffer, hashStrings);

      if (duplicate) {
        // Reject duplicate — revert proof status
        await this.pool.query(
          `UPDATE proofs SET status = 'REJECTED', media_uri = NULL WHERE id = $1`,
          [proofId],
        );

        await this.truthLog.appendEvent('PROOF_DUPLICATE_REJECTED', {
          proofId,
          closestDistance,
          userId: user.id,
        });

        throw new ConflictException(
          `Duplicate proof detected (similarity distance: ${closestDistance}). Submission rejected.`,
        );
      }

      // Store hash for future dedup
      await this.pool.query(
        `INSERT INTO proof_hashes (proof_id, phash) VALUES ($1, $2)
         ON CONFLICT (proof_id) DO NOTHING`,
        [proofId, frameHash],
      );
    } catch (err) {
      // Re-throw ConflictException, swallow pHash processing errors (degrade gracefully)
      if (err instanceof ConflictException) throw err;
      // pHash failure should not block proof submission in dev/staging
    }

    // Enqueue Fury routing immediately
    const jobId = await this.furyRouter.routeProof(proofId, user.id);

    await this.truthLog.appendEvent('PROOF_UPLOAD_CONFIRMED', {
      proofId,
      contractId: proof.rows[0].contract_id,
      userId: user.id,
      storageKey: dto.storageKey,
      furyRouteJobId: jobId,
    });

    return {
      proofId,
      status: 'PENDING_REVIEW',
      furyRouteJobId: jobId,
    };
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get proof details with a signed view URL (for Fury auditors)' })
  async getProofDetail(@Param('id') proofId: string) {
    const proof = await this.pool.query(
      `SELECT p.id, p.contract_id, p.status, p.content_type, p.description,
              p.media_uri, p.submitted_at, p.uploaded_at, p.is_honeypot
       FROM proofs p
       WHERE p.id = $1`,
      [proofId],
    );

    if (proof.rows.length === 0) {
      throw new NotFoundException('Proof not found');
    }

    const row = proof.rows[0];

    // Generate a signed view URL if media exists
    let viewUrl: string | null = null;
    if (row.media_uri) {
      viewUrl = await this.r2.generateViewUrl(row.media_uri);
    }

    return {
      id: row.id,
      contractId: row.contract_id,
      status: row.status,
      contentType: row.content_type,
      description: row.description,
      submittedAt: row.submitted_at,
      uploadedAt: row.uploaded_at,
      isHoneypot: row.is_honeypot,
      viewUrl,
    };
  }
}
