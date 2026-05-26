import { AttestationScheduler } from './attestation.scheduler';
import { ContractsService } from './contracts.service';
import { Pool } from 'pg';
import { NOCONTACT_MISS_STRIKE_THRESHOLD } from '../../../../shared/libs/behavioral-logic';

describe('AttestationScheduler', () => {
  let scheduler: AttestationScheduler;
  let mockPool: { query: jest.Mock };
  let mockContractsService: { resolveContract: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockContractsService = { resolveContract: jest.fn().mockResolvedValue(undefined) };
    scheduler = new AttestationScheduler(
      mockPool as unknown as Pool,
      mockContractsService as unknown as ContractsService,
    );
    jest.clearAllMocks();
  });

  describe('createDailyAttestations', () => {
    it('should create pending attestations for active RECOVERY contracts', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'att-1' }, { id: 'att-2' }] });

      await scheduler.createDailyAttestations();

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      const sql = mockPool.query.mock.calls[0][0];
      expect(sql).toContain('RECOVERY_%');
      expect(sql).toContain('PENDING');
    });
  });

  describe('processExpiredAttestations', () => {
    it('should mark PENDING attestations from yesterday as MISSED and increment strikes by one', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ contract_id: 'c-1' }] }) // missed
        .mockResolvedValueOnce({ rows: [{ user_id: 'u-1', strikes: 1 }] }); // single +1 update

      await scheduler.processExpiredAttestations();

      // LC11: strikes are applied one-at-a-time (per missed day), not as a bulk +N.
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('strikes = strikes + 1'),
        ['c-1'],
      );
    });

    it('LC11: should apply a catch-up of missed days one strike at a time (per-miss escalation)', async () => {
      // A catch-up run surfaces 3 missed days for the same contract. They must be
      // replayed as three separate +1 updates, NOT collapsed into a single +3 bump,
      // so the pre-threshold escalation/intervention is preserved. The third strike
      // reaches the threshold and auto-FAILs (loop then stops).
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ contract_id: 'c-1' }, { contract_id: 'c-1' }, { contract_id: 'c-1' }] }) // missed (3 days)
        .mockResolvedValueOnce({ rows: [{ user_id: 'u-1', strikes: 1 }] }) // +1 → 1
        .mockResolvedValueOnce({ rows: [{ user_id: 'u-1', strikes: 2 }] }) // +1 → 2
        .mockResolvedValueOnce({ rows: [{ user_id: 'u-1', strikes: NOCONTACT_MISS_STRIKE_THRESHOLD }] }); // +1 → 3 (auto-FAIL)

      await scheduler.processExpiredAttestations();

      // 1 missed query + 3 per-day strike updates = 4 queries (loop breaks at FAIL).
      expect(mockPool.query).toHaveBeenCalledTimes(4);
      const strikeUpdates = mockPool.query.mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('strikes = strikes + 1'),
      );
      expect(strikeUpdates).toHaveLength(3);
      expect(mockContractsService.resolveContract).toHaveBeenCalledTimes(1);
      expect(mockContractsService.resolveContract).toHaveBeenCalledWith('c-1', 'FAILED');
    });

    it('should auto-FAIL contract when a strike reaches the threshold', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ contract_id: 'c-2' }] })
        .mockResolvedValueOnce({ rows: [{ user_id: 'u-2', strikes: NOCONTACT_MISS_STRIKE_THRESHOLD }] });

      await scheduler.processExpiredAttestations();

      expect(mockContractsService.resolveContract).toHaveBeenCalledWith('c-2', 'FAILED');
    });

    it('should not auto-FAIL when strikes below threshold', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ contract_id: 'c-3' }] })
        .mockResolvedValueOnce({ rows: [{ user_id: 'u-3', strikes: NOCONTACT_MISS_STRIKE_THRESHOLD - 1 }] });

      await scheduler.processExpiredAttestations();

      expect(mockContractsService.resolveContract).not.toHaveBeenCalled();
    });

    it('should stop applying strikes once the contract is no longer ACTIVE', async () => {
      // A catch-up surfaces 2 missed days, but the first +1 update matches zero rows
      // (contract already resolved by another path) → the loop must break.
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ contract_id: 'c-6' }, { contract_id: 'c-6' }] }) // missed (2 days)
        .mockResolvedValueOnce({ rows: [] }); // first +1 update: no ACTIVE row

      await scheduler.processExpiredAttestations();

      // missed query + a single (zero-row) strike update; no second strike applied.
      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockContractsService.resolveContract).not.toHaveBeenCalled();
    });

    it('should handle errors for individual contracts without stopping the batch', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ contract_id: 'c-4' }, { contract_id: 'c-5' }] })
        .mockRejectedValueOnce(new Error('DB error')) // c-4 first strike update throws
        .mockResolvedValueOnce({ rows: [{ user_id: 'u-5', strikes: 1 }] }); // c-5 strike update

      await scheduler.processExpiredAttestations();

      // missed query + c-4 (throws) + c-5 (succeeds) = 3 queries.
      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });
  });
});