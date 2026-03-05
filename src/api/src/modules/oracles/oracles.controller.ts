import { Controller, Post, Body, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HealthKitGuardService, HealthKitSampleMetadata } from '../compliance/healthkit-guard.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { ContractsService } from '../contracts/contracts.service';

export class IngestHealthKitSamplesDto {
  samples!: {
    type: string;
    value: number;
    startDate: string;
    endDate: string;
    metadata?: HealthKitSampleMetadata;
  }[];
}

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
    const results = [];

    for (const sample of dto.samples) {
      const validation = this.healthKitGuard.validateMetadata(sample.metadata || {});
      
      const payloadString = JSON.stringify(sample);
      const sampleHash = crypto.createHash('sha256').update(payloadString + user.id).digest('hex');

      // TKT-P1-007: Health Data Bridge Schema insertion
      try {
        await this.pool.query(
          `INSERT INTO health_oracle_samples 
           (user_id, source_bundle_id, was_user_entered, sample_hash, accepted, reason, payload)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (sample_hash) DO NOTHING`,
          [
            user.id,
            sample.metadata?.sourceBundleId || 'UNKNOWN',
            this.healthKitGuard['isLikelyManualEntry'](sample.metadata || {}), // reuse private method for convenience or duplicate logic
            sampleHash,
            validation.accepted,
            validation.reason || null,
            payloadString
          ]
        );
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
}
