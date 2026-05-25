import { Controller, Post, Body, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HealthKitGuardService, HealthKitSampleMetadata } from '../compliance/healthkit-guard.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { ContractsService } from '../contracts/contracts.service';

export class HealthKitSampleDto {
  @IsString()
  type!: string;

  @IsNumber()
  value!: number;

  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;

  @IsOptional()
  @IsObject()
  metadata?: HealthKitSampleMetadata;
}

export class IngestHealthKitSamplesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HealthKitSampleDto)
  samples!: HealthKitSampleDto[];
}

/**
 * Allowlist of trusted hardware source bundle IDs permitted to feed contract
 * verification samples. An allowlist fails closed for unknown/spoofed sources,
 * unlike the previous 2-entry blacklist which implicitly trusted everything else.
 *
 * NOTE: bundle IDs are still client-supplied and can be spoofed. This is
 * necessary but not sufficient — true anti-spoofing requires device attestation
 * / signed payloads (App Attest, Play Integrity). (residual)
 */
const TRUSTED_SOURCE_BUNDLES = new Set<string>([
  'com.apple.health.watchos',
  'com.google.android.apps.healthdata',
]);

// Reject readings whose start is more than this far in the past, or any reading
// dated in the future (clock-skew tolerance applied to the future bound).
const MAX_SAMPLE_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const FUTURE_SKEW_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

@ApiTags('Oracles')
@ApiBearerAuth()
@Controller('oracles')
@UseGuards(AuthGuard)
export class OraclesController {
  private readonly logger = new Logger(OraclesController.name);

  constructor(
    private readonly pool: Pool,
    private readonly healthKitGuard: HealthKitGuardService,
    private readonly truthLog: TruthLogService,
    private readonly contractsService: ContractsService,
  ) {}

  @Post('healthkit/samples')
  @ApiOperation({ summary: 'Ingest HealthKit samples with server-side manual entry filtering' })
  async ingestHealthKitSamples(
    @CurrentUser() user: { id: string },
    @Body() dto: IngestHealthKitSamplesDto,
  ) {
    if (!dto || !Array.isArray(dto.samples)) {
      throw new BadRequestException('Request body must include a samples array');
    }

    const results = [];

    for (const sample of dto.samples) {
      const metadata = sample.metadata || {};

      // Layered server-side acceptance check. The HealthKitGuard rejects manual
      // entries; on top of that we require a trusted source bundle and a sane
      // reading window before the sample can advance any contract.
      const validation = this.resolveValidation(sample, metadata);

      const payloadString = JSON.stringify(sample);
      const sampleHash = crypto.createHash('sha256').update(payloadString + user.id).digest('hex');

      // TKT-P1-007: Health Data Bridge Schema insertion.
      // Dedup on sample_hash: only process when the insert created a NEW row, so a
      // replayed payload cannot advance contracts repeatedly.
      let insertedNewRow = false;
      try {
        const insertResult = await this.pool.query(
          `INSERT INTO health_oracle_samples
           (user_id, source_bundle_id, was_user_entered, sample_hash, accepted, reason, payload)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (sample_hash) DO NOTHING
           RETURNING id`,
          [
            user.id,
            metadata.sourceBundleId || 'UNKNOWN',
            this.healthKitGuard.isLikelyManualEntry(metadata),
            sampleHash,
            validation.accepted,
            validation.reason || null,
            payloadString,
          ],
        );
        insertedNewRow = (insertResult.rowCount ?? 0) > 0;
      } catch (err) {
        this.logger.warn(`Failed to insert health_oracle_samples record: ${err}`);
      }

      if (!validation.accepted) {
        await this.truthLog.appendEvent('HEALTHKIT_SAMPLE_REJECTED', {
          userId: user.id,
          sampleType: sample.type,
          reason: validation.reason,
          metadata: sample.metadata,
        });
        results.push({ type: sample.type, accepted: false, reason: validation.reason });
        continue;
      }

      // Replayed / duplicate payload: the dedup insert hit ON CONFLICT and did not
      // insert a new row. Skip processing so contracts are not advanced again.
      if (!insertedNewRow) {
        results.push({ type: sample.type, accepted: false, reason: 'Duplicate sample (already processed)' });
        continue;
      }

      // Record accepted sample in TruthLog
      await this.truthLog.appendEvent('HEALTHKIT_SAMPLE_ACCEPTED', {
        userId: user.id,
        sampleType: sample.type,
        value: sample.value,
        startDate: sample.startDate,
        endDate: sample.endDate,
        metadata: sample.metadata,
      });

      // Process sample to fulfill active contracts
      await this.contractsService.processHealthKitSample(user.id, sample);

      results.push({ type: sample.type, accepted: true });
    }

    return { results };
  }

  private resolveValidation(
    sample: HealthKitSampleDto,
    metadata: HealthKitSampleMetadata,
  ): { accepted: boolean; reason?: string } {
    // 1. Manual-entry / source policy (existing compliance guard).
    const guardResult = this.healthKitGuard.validateMetadata(metadata);
    if (!guardResult.accepted) {
      return guardResult;
    }

    // 2. Required metadata fields must be present (reject if missing).
    const sourceBundleId = String(metadata.sourceBundleId || '').trim();
    if (!sourceBundleId) {
      return { accepted: false, reason: 'Missing required metadata field: sourceBundleId' };
    }
    if (!metadata.sourceName) {
      return { accepted: false, reason: 'Missing required metadata field: sourceName' };
    }

    // 3. Allowlist of trusted hardware source bundles (fail closed for unknown sources).
    if (!TRUSTED_SOURCE_BUNDLES.has(sourceBundleId)) {
      return { accepted: false, reason: 'Sample must originate from a verified hardware device/app' };
    }

    // 4. Timestamp sanity: reject future-dated or stale readings.
    const timestampResult = this.validateTimestamps(sample);
    if (!timestampResult.accepted) {
      return timestampResult;
    }

    return { accepted: true };
  }

  private validateTimestamps(sample: HealthKitSampleDto): { accepted: boolean; reason?: string } {
    const start = Date.parse(sample.startDate);
    const end = Date.parse(sample.endDate);

    if (Number.isNaN(start) || Number.isNaN(end)) {
      return { accepted: false, reason: 'Invalid startDate/endDate' };
    }
    if (end < start) {
      return { accepted: false, reason: 'endDate precedes startDate' };
    }

    const now = Date.now();
    if (start > now + FUTURE_SKEW_TOLERANCE_MS || end > now + FUTURE_SKEW_TOLERANCE_MS) {
      return { accepted: false, reason: 'Reading is dated in the future' };
    }
    if (now - start > MAX_SAMPLE_AGE_MS) {
      return { accepted: false, reason: 'Reading is outside the accepted ingestion window' };
    }

    return { accepted: true };
  }
}
