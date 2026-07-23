import { EnforcementService } from './enforcement.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { Pool } from 'pg';

describe('EnforcementService', () => {
  let service: EnforcementService;
  let mockPool: { query: jest.Mock };
  let mockTruthLog: { appendEvent: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockTruthLog = { appendEvent: jest.fn().mockResolvedValue('log-id') };
    service = new EnforcementService(
      mockPool as unknown as Pool,
      mockTruthLog as unknown as TruthLogService,
    );
    jest.clearAllMocks();
  });

  describe('applyPenalty (LC9 idempotency)', () => {
    it('applies the penalty and logs once when no prior penalty exists', async () => {
      // INSERT ... RETURNING id → one inserted row
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'penalty-1' }] });
      // UPDATE fury_enforcement_cases
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // SELECT reviewer_id
      mockPool.query.mockResolvedValueOnce({ rows: [{ reviewer_id: 'fury-1' }] });

      await service.applyPenalty('case-1', 'REP_BURN', 0);

      const insertCall = mockPool.query.mock.calls[0];
      expect(insertCall[0]).toMatch(/INSERT INTO fury_penalties/);
      expect(insertCall[0]).toMatch(/WHERE NOT EXISTS/);
      expect(mockTruthLog.appendEvent).toHaveBeenCalledTimes(1);
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'FURY_PENALTY_APPLIED',
        expect.objectContaining({ caseId: 'case-1', reviewerId: 'fury-1' }),
      );
    });

    it('is a no-op (no duplicate penalty, no second TruthLog) when a penalty already exists', async () => {
      // INSERT ... RETURNING id → zero rows because WHERE NOT EXISTS matched
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.applyPenalty('case-1', 'REP_BURN', 0);

      // Only the guarded INSERT ran; no status UPDATE, no SELECT, no TruthLog append.
      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
    });
  });

  describe('confirmCase', () => {
    it('rejects when the pending case cannot be claimed', async () => {
      // claim UPDATE ... RETURNING id → zero rows (already applied / not pending)
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.confirmCase('case-x')).rejects.toThrow('Pending case not found');
    });
  });

  describe('resolveAppeal', () => {
    it('resolves an appeal as UPHELD', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'case-1', reviewer_id: 'fury-1' }],
      });

      const result = await service.resolveAppeal('case-1', 'UPHELD', 'Penalty confirmed');

      expect(result.outcome).toBe('UPHELD');
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'FURY_APPEAL_RESOLVED',
        expect.objectContaining({ outcome: 'UPHELD' }),
      );
    });

    it('resolves an appeal as REVERSED and removes penalty', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'case-1', reviewer_id: 'fury-1' }],
      });
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 }); // DELETE penalty

      const result = await service.resolveAppeal('case-1', 'REVERSED');

      expect(result.outcome).toBe('REVERSED');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM fury_penalties'),
        ['case-1'],
      );
    });

    it('throws on invalid outcome', async () => {
      await expect(
        service.resolveAppeal('case-1', 'INVALID' as any),
      ).rejects.toThrow('Outcome must be UPHELD or REVERSED');
    });

    it('throws when case is not in APPEALED status', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.resolveAppeal('case-1', 'UPHELD'),
      ).rejects.toThrow('Appealed case not found');
    });
  });
});
