import { Test, TestingModule } from '@nestjs/testing';
import { OraclesController } from './oracles.controller';
import { HealthKitGuardService } from '../compliance/healthkit-guard.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { Pool } from 'pg';
import { ContractsService } from '../contracts/contracts.service';

describe('OraclesController', () => {
  let controller: OraclesController;
  let healthKitGuard: jest.Mocked<HealthKitGuardService>;
  let truthLog: jest.Mocked<TruthLogService>;
  let contractsService: jest.Mocked<ContractsService>;

  beforeEach(async () => {
    const mockHealthKitGuard = {
      validateMetadata: jest.fn(),
      isLikelyManualEntry: jest.fn().mockReturnValue(false),
    };
    const mockTruthLog = {
      appendEvent: jest.fn(),
    };
    const mockContractsService = {
      processHealthKitSample: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OraclesController],
      providers: [
        // Dedup insert returns a new row (rowCount: 1) so accepted samples are processed.
        { provide: Pool, useValue: { query: jest.fn().mockResolvedValue({ rows: [{ id: 'sample-1' }], rowCount: 1 }) } },
        { provide: HealthKitGuardService, useValue: mockHealthKitGuard },
        { provide: TruthLogService, useValue: mockTruthLog },
        { provide: ContractsService, useValue: mockContractsService },
      ],
    }).compile();

    controller = module.get<OraclesController>(OraclesController);
    healthKitGuard = module.get(HealthKitGuardService);
    truthLog = module.get(TruthLogService);
    contractsService = module.get(ContractsService);
  });

  it('should accept valid samples and call processHealthKitSample', async () => {
    healthKitGuard.validateMetadata.mockReturnValue({ accepted: true });

    const user = { id: 'user-123' };
    // A recent, in-window reading from an allowlisted hardware source with the
    // required metadata fields present.
    const now = new Date().toISOString();
    const dto = {
      samples: [
        {
          type: 'HKQuantityTypeIdentifierBodyMass',
          value: 180,
          startDate: now,
          endDate: now,
          metadata: {
            sourceBundleId: 'com.apple.health.watchos',
            sourceName: 'Apple Watch',
          },
        },
      ],
    };

    const result = await controller.ingestHealthKitSamples(user, dto);

    expect(result.results[0].accepted).toBe(true);
    expect(truthLog.appendEvent).toHaveBeenCalledWith('HEALTHKIT_SAMPLE_ACCEPTED', expect.any(Object));
    expect(contractsService.processHealthKitSample).toHaveBeenCalledWith(user.id, dto.samples[0]);
  });

  it('should reject manual samples and log rejection', async () => {
    healthKitGuard.validateMetadata.mockReturnValue({ accepted: false, reason: 'manual' });
    
    const user = { id: 'user-123' };
    const dto = {
      samples: [
        {
          type: 'HKQuantityTypeIdentifierBodyMass',
          value: 180,
          startDate: '2026-03-04T00:00:00Z',
          endDate: '2026-03-04T00:00:00Z',
          metadata: { sourceBundleId: 'com.apple.Health' },
        },
      ],
    };

    const result = await controller.ingestHealthKitSamples(user, dto);

    expect(result.results[0].accepted).toBe(false);
    expect(truthLog.appendEvent).toHaveBeenCalledWith('HEALTHKIT_SAMPLE_REJECTED', expect.any(Object));
    expect(contractsService.processHealthKitSample).not.toHaveBeenCalled();
  });
});
