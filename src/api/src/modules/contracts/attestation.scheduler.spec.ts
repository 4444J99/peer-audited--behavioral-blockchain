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

    it('should do nothing when no new attestations are needed', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await scheduler.createDailyAttestations();

      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('processExpiredAttestations', () => {
    it('should mark PENDING attestations from yesterday as MISSED', async () => {
      // Update query returns missed attestations
      mockPool.query.mockResolvedValueOnce({ rows: [{ contract_id: 'c-1' }] });
      // Strike increment
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // Check strikes count
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'c-1', strikes: 1 }] });

      await scheduler.processExpiredAttestations();

      // Verify strike was incremented
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('strikes = strikes + 1'),
        ['c-1'],
      );
    });

    it('should auto-FAIL contract when strikes hit threshold', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ contract_id: 'c-2' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // strike increment
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'c-2', strikes: NOCONTACT_MISS_STRIKE_THRESHOLD }],
      });

      await scheduler.processExpiredAttestations();

      expect(mockContractsService.resolveContract).toHaveBeenCalledWith('c-2', 'FAILED');
    });

    it('should not auto-FAIL when strikes below threshold', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ contract_id: 'c-3' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'c-3', strikes: NOCONTACT_MISS_STRIKE_THRESHOLD - 1 }],
      });

      await scheduler.processExpiredAttestations();

      expect(mockContractsService.resolveContract).not.toHaveBeenCalled();
    });

    it('should do nothing when no attestations are expired', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await scheduler.processExpiredAttestations();

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockContractsService.resolveContract).not.toHaveBeenCalled();
    });

    it('should handle errors for individual contracts without stopping the batch', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ contract_id: 'c-4' }, { contract_id: 'c-5' }],
      });
      // c-4 strike increment throws
      mockPool.query.mockRejectedValueOnce(new Error('DB error'));
      // c-5 processes normally
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // strike increment
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'c-5', strikes: 1 }] });

      await scheduler.processExpiredAttestations();

      // Should not throw, should continue to c-5
      expect(mockPool.query).toHaveBeenCalledTimes(4);
    });
  });
});
