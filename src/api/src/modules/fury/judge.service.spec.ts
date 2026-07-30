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
        `UPDATE disputes SET appeal_status = $1, judge_notes = $2, resolved_at = NOW(), judge_user_id = $3 WHERE id = $4`,
        ['RESOLVED_OVERTURNED', 'Evidence looks good upon review', 'j-789', 'd-123'],
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
      clientMock.query.mockImplementation((q: string) => {
        if (q.startsWith('UPDATE disputes')) throw error;
        return Promise.resolve();
      });

      await expect(service.resolveDispute(resolution)).rejects.toThrow('DB Error');

      // A FAIL verdict leaves the original rejection standing.
      expect(clientMock.query).toHaveBeenCalledWith(
        `UPDATE disputes SET appeal_status = $1, judge_notes = $2, resolved_at = NOW(), judge_user_id = $3 WHERE id = $4`,
        ['RESOLVED_UPHELD', 'Tampered proof', 'j-789', 'd-123'],
      );

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
      pool.query.mockImplementation((q: string) => {
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

    it('should reach contracts through proofs and filter on appeal_status', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await service.getPendingQueue();

      const disputeSql: string = pool.query.mock.calls
        .map((call: any[]) => call[0])
        .find((sql: string) => sql.includes('FROM disputes'));

      // disputes has no contract_id — the contract is reached via proofs.contract_id.
      expect(disputeSql).toContain('JOIN proofs p ON d.proof_id = p.id');
      expect(disputeSql).toContain('JOIN contracts c ON p.contract_id = c.id');
      expect(disputeSql).toContain('p.contract_id');
      expect(disputeSql).not.toContain('d.contract_id');

      // The lifecycle column is appeal_status, not status.
      expect(disputeSql).toContain(
        `d.appeal_status IN ('FEE_AUTHORIZED_PENDING_REVIEW', 'IN_REVIEW')`,
      );
      expect(disputeSql).not.toContain('d.status');
    });
  });
});
