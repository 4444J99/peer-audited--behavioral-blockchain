// Mock @nestjs/schedule before importing the scheduler — the package is not installed
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => {},
  CronExpression: { EVERY_HOUR: '0 * * * *' },
}), { virtual: true });

import { ContractsScheduler } from './contracts.scheduler';
import { ContractsService } from './contracts.service';
import { Pool } from 'pg';

describe('ContractsScheduler', () => {
  let scheduler: ContractsScheduler;
  let mockPool: { query: jest.Mock };

  const mockContractsService = {
    resolveContract: jest.fn().mockResolvedValue(undefined),
    sweepFailedContractResolutionSideEffects: jest.fn().mockResolvedValue({
      staleResetCount: 0,
      groupsFound: 0,
      groupsRetried: 0,
      groupsFailed: 0,
    }),
  } as unknown as ContractsService;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    scheduler = new ContractsScheduler(
      mockPool as unknown as Pool,
      mockContractsService,
    );
    jest.clearAllMocks();
  });

  describe('handleExpiredContracts', () => {
    it('should call resolveContract(FAILED) for each expired contract', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'expired-1' }, { id: 'expired-2' }, { id: 'expired-3' }],
      });

      await scheduler.handleExpiredContracts();

      expect(mockContractsService.resolveContract).toHaveBeenCalledTimes(3);
      expect(mockContractsService.resolveContract).toHaveBeenCalledWith('expired-1', 'FAILED');
      expect(mockContractsService.resolveContract).toHaveBeenCalledWith('expired-2', 'FAILED');
      expect(mockContractsService.resolveContract).toHaveBeenCalledWith('expired-3', 'FAILED');
    });

    it('should skip when no expired contracts exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await scheduler.handleExpiredContracts();

      expect(mockContractsService.resolveContract).not.toHaveBeenCalled();
    });

    it('should continue processing remaining contracts if one resolution fails', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'ok-1' }, { id: 'fail-1' }, { id: 'ok-2' }],
      });

      (mockContractsService.resolveContract as jest.Mock)
        .mockResolvedValueOnce(undefined) // ok-1 succeeds
        .mockRejectedValueOnce(new Error('DB connection lost')) // fail-1 throws
        .mockResolvedValueOnce(undefined); // ok-2 succeeds

      await scheduler.handleExpiredContracts();

      expect(mockContractsService.resolveContract).toHaveBeenCalledTimes(3);
      expect(mockContractsService.resolveContract).toHaveBeenCalledWith('ok-1', 'FAILED');
      expect(mockContractsService.resolveContract).toHaveBeenCalledWith('fail-1', 'FAILED');
      expect(mockContractsService.resolveContract).toHaveBeenCalledWith('ok-2', 'FAILED');
    });
  });

  describe('retryFailedContractResolutionSideEffects', () => {
    it('should trigger the contract resolution outbox sweep', async () => {
      await scheduler.retryFailedContractResolutionSideEffects();

      expect(
        (mockContractsService as any).sweepFailedContractResolutionSideEffects,
      ).toHaveBeenCalledTimes(1);
    });

    it('should tolerate sweep results with failures and not throw', async () => {
      ((mockContractsService as any).sweepFailedContractResolutionSideEffects as jest.Mock)
        .mockResolvedValueOnce({
          staleResetCount: 1,
          groupsFound: 2,
          groupsRetried: 1,
          groupsFailed: 1,
        });

      await expect(scheduler.retryFailedContractResolutionSideEffects()).resolves.toBeUndefined();
    });
  });
});
