import { Test, TestingModule } from '@nestjs/testing';
import { JudgeService, DisputeResolution } from './judge.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { ContractsService } from '../contracts/contracts.service';
import { Pool } from 'pg';

describe('JudgeService', () => {
  let service: JudgeService;
  let pool: any;
  let truthLog: any;
  let contractsService: any;
  let clientMock: any;

  beforeEach(async () => {
    clientMock = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool = {
      connect: jest.fn().mockResolvedValue(clientMock),
      query: jest.fn(),
    };

    truthLog = {
      appendEvent: jest.fn(),
    };

    contractsService = {
      resolveContract: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JudgeService,
        { provide: Pool, useValue: pool },
        { provide: TruthLogService, useValue: truthLog },
        { provide: ContractsService, useValue: contractsService },
      ],
    }).compile();

    service = module.get<JudgeService>(JudgeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveDispute', () => {
    it('should resolve a dispute locally then apply external side-effects', async () => {
      const resolution: DisputeResolution = {
        disputeId: 'd-123',
        contractId: 'c-456',
        verdict: 'PASS',
        reason: 'Evidence looks good upon review',
        judgeId: 'j-789',
      };

      await service.resolveDispute(resolution);

      expect(pool.connect).toHaveBeenCalled();
      expect(clientMock.query).toHaveBeenCalledWith('BEGIN');
      expect(clientMock.query).toHaveBeenCalledWith(
        `UPDATE disputes SET status = 'RESOLVED', resolution = $1, resolved_at = NOW(), judge_id = $2 WHERE id = $3`,
        ['PASS', 'j-789', 'd-123'],
      );
      expect(clientMock.query).toHaveBeenCalledWith('COMMIT');
      expect(clientMock.release).toHaveBeenCalled();

      expect(truthLog.appendEvent).toHaveBeenCalledWith('JUDICIAL_OVERRIDE', expect.objectContaining({
        disputeId: 'd-123',
        contractId: 'c-456',
        verdict: 'PASS',
        judgeId: 'j-789',
      }));

      expect(contractsService.resolveContract).toHaveBeenCalledWith('c-456', 'COMPLETED');
    });

    it('should rollback transaction if dispute resolution fails and not trigger external side-effects', async () => {
      const resolution: DisputeResolution = {
        disputeId: 'd-123',
        contractId: 'c-456',
        verdict: 'FAIL',
        reason: 'Tampered proof',
        judgeId: 'j-789',
      };

      const error = new Error('DB Error');
      clientMock.query.mockImplementation((q) => {
        if (q.startsWith('UPDATE disputes')) throw error;
        return Promise.resolve();
      });

      await expect(service.resolveDispute(resolution)).rejects.toThrow('DB Error');

      expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
      expect(clientMock.release).toHaveBeenCalled();

      expect(truthLog.appendEvent).not.toHaveBeenCalled();
      expect(contractsService.resolveContract).not.toHaveBeenCalled();
    });

    it('should trigger side effects directly if no disputeId is provided', async () => {
      const resolution: DisputeResolution = {
        contractId: 'c-456',
        verdict: 'FAIL',
        reason: 'Split consensus forced fail',
        judgeId: 'j-789',
      };

      await service.resolveDispute(resolution);

      expect(pool.connect).not.toHaveBeenCalled();

      expect(truthLog.appendEvent).toHaveBeenCalledWith('JUDICIAL_OVERRIDE', expect.objectContaining({
        contractId: 'c-456',
        verdict: 'FAIL',
        judgeId: 'j-789',
      }));

      expect(contractsService.resolveContract).toHaveBeenCalledWith('c-456', 'FAILED');
    });
  });

  describe('getPendingQueue', () => {
    it('should retrieve both split proofs and active disputes', async () => {
      pool.query.mockImplementation((q) => {
        if (q.includes('FROM proofs')) return Promise.resolve({ rows: [{ proof_id: 'p-1' }] });
        if (q.includes('FROM disputes')) return Promise.resolve({ rows: [{ id: 'd-1' }] });
        return Promise.resolve({ rows: [] });
      });

      const result = await service.getPendingQueue();

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        splitProofs: [{ proof_id: 'p-1' }],
        disputes: [{ id: 'd-1' }],
      });
    });
  });
});
