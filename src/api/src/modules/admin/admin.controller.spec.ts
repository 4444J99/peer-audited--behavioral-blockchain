import { AdminController } from './admin.controller';
import { ModerationService } from '../../../services/security/moderation.service';
import { HoneypotService } from '../../../services/intelligence/honeypot.service';
import { ContractsService } from '../contracts/contracts.service';
import { Pool } from 'pg';

describe('AdminController', () => {
  let controller: AdminController;
  let mockPool: { query: jest.Mock };

  const mockModeration = {
    banUser: jest.fn(),
  } as unknown as ModerationService;

  const mockHoneypot = {
    injectKnownFail: jest.fn(),
  } as unknown as HoneypotInjectorService;

  const mockContracts = {
    resolveContract: jest.fn(),
  } as unknown as ContractsService;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    controller = new AdminController(mockModeration, mockHoneypot as any, mockContracts, {} as any, {} as any, mockPool as unknown as Pool);
    jest.clearAllMocks();
  });

  describe('injectHoneypot', () => {
    it('should delegate to HoneypotInjectorService and return jobId', async () => {
      (mockHoneypot.injectKnownFail as jest.Mock).mockResolvedValueOnce('job-hp-1');

      const result = await controller.injectHoneypot();

      expect(result).toEqual({ status: 'honeypot_injected', jobId: 'job-hp-1' });
      expect(mockHoneypot.injectKnownFail).toHaveBeenCalledTimes(1);
    });
  });

  describe('banUser', () => {
    it('should delegate to ModerationService with correct params', async () => {
      (mockModeration.banUser as jest.Mock).mockResolvedValueOnce({
        status: 'USER_PERMANENTLY_BANNED',
        eventId: 'evt-1',
      });

      const result = await controller.banUser(
        'target-user-1',
        { id: 'ADMIN_root' },
        { reason: 'Repeated fraud violations' },
      );

      expect(result).toEqual({
        status: 'USER_PERMANENTLY_BANNED',
        eventId: 'evt-1',
      });
      expect(mockModeration.banUser).toHaveBeenCalledWith(
        'ADMIN_root',
        'target-user-1',
        'Repeated fraud violations',
      );
    });

    it('should propagate ForbiddenException from ModerationService for non-admin', async () => {
      (mockModeration.banUser as jest.Mock).mockRejectedValueOnce(
        new Error('User non-admin lacks the required ADMIN role'),
      );

      await expect(
        controller.banUser(
          'target-user-1',
          { id: 'non-admin' },
          { reason: 'test' },
        ),
      ).rejects.toThrow(/ADMIN role/);
    });
  });

  describe('resolveContract', () => {
    it('should delegate to ContractsService and return result', async () => {
      (mockContracts.resolveContract as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await controller.resolveContract('contract-1', { outcome: 'COMPLETED' });

      expect(result).toEqual({ status: 'resolved', contractId: 'contract-1', outcome: 'COMPLETED' });
      expect(mockContracts.resolveContract).toHaveBeenCalledWith('contract-1', 'COMPLETED');
    });
  });

  describe('getStats', () => {
    it('should return system statistics', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '42' }] })
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '67.5' }] });

      const result = await controller.getStats();

      expect(result).toEqual({
        totalUsers: 42,
        activeContracts: 10,
        pendingProofs: 5,
        avgIntegrity: 67.5,
      });
    });
  });
});
