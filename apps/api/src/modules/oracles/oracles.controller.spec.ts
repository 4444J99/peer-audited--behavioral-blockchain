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

    // AU1: the handler first runs a live-status check (SELECT status ...) and only
    // proceeds for ACTIVE accounts, then performs the dedup insert (rowCount: 1 so
    // accepted samples are processed). Route the status query to an ACTIVE row.
    const mockPoolQuery = jest.fn((sql: string) => {
      if (typeof sql === 'string' && sql.includes('SELECT status FROM users')) {
        return Promise.resolve({ rows: [{ status: 'ACTIVE' }], rowCount: 1 });
      }
      return Promise.resolve({ rows: [{ id: 'sample-1' }], rowCount: 1 });
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OraclesController],
      providers: [
        { provide: Pool, useValue: { query: mockPoolQuery } },
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

  it('AU1: rejects ingestion for a non-ACTIVE (e.g. quarantined) account before processing', async () => {
    const { ForbiddenException } = require('@nestjs/common');
    // Override the pool so the live-status check returns a non-ACTIVE status.
    (controller as any).pool = {
      query: jest.fn((sql: string) => {
        if (typeof sql === 'string' && sql.includes('SELECT status FROM users')) {
          return Promise.resolve({ rows: [{ status: 'QUARANTINED' }], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      }),
    };

    const now = new Date().toISOString();
    const dto = {
      samples: [
        {
          type: 'HKQuantityTypeIdentifierBodyMass',
          value: 180,
          startDate: now,
          endDate: now,
          metadata: { sourceBundleId: 'com.apple.health.watchos', sourceName: 'Apple Watch' },
        },
      ],
    };

    await expect(controller.ingestHealthKitSamples({ id: 'banned-user' }, dto)).rejects.toThrow(ForbiddenException);
    expect(contractsService.processHealthKitSample).not.toHaveBeenCalled();
  });
});
