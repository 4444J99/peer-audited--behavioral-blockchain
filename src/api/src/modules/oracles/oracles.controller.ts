import { Controller, Post, Body, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
