import { ModerationService } from './moderation.service';
import { TruthLogService } from '../ledger/truth-log.service';
import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';

describe('ModerationService', () => {
  let modService: ModerationService;

  const mockTruthLog = {
    appendEvent: jest.fn(),
  } as unknown as TruthLogService;

  const mockPool = {
    query: jest.fn(),
  } as unknown as Pool;

  beforeEach(() => {
    modService = new ModerationService(mockTruthLog, mockPool);
    jest.clearAllMocks();
  });

  describe('banUser', () => {
    it('should verify admin role via DB, log ACCOUNT_BANNED event, and update user status', async () => {
      // Mock: admin role lookup returns ADMIN
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] }) // admin role check
        .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE users SET status = 'BANNED'

      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValueOnce('evt-ban-123');

      const result = await modService.banUser('admin-uuid-001', 'user_cheater', 'Failed 3 audits');

      expect(result.status).toBe('USER_PERMANENTLY_BANNED');
      expect(result.eventId).toBe('evt-ban-123');

      // Verify admin role was checked via DB
      const roleCheckCall = (mockPool.query as jest.Mock).mock.calls[0];
      expect(roleCheckCall[0]).toContain('SELECT role FROM users');
      expect(roleCheckCall[1]).toEqual(['admin-uuid-001']);

      // Verify truth log was called
      const appendCall = (mockTruthLog.appendEvent as jest.Mock).mock.calls[0];
      expect(appendCall[0]).toBe('ACCOUNT_BANNED');
      expect(appendCall[1].targetUserId).toBe('user_cheater');
      expect(appendCall[1].executedBy).toBe('admin-uuid-001');
      expect(appendCall[1].action).toBe('PERMANENT_EXILE');

      // Verify user status was updated to BANNED
      const statusUpdateCall = (mockPool.query as jest.Mock).mock.calls[1];
      expect(statusUpdateCall[0]).toContain("status = 'BANNED'");
      expect(statusUpdateCall[1]).toEqual(['user_cheater']);
    });

    it('should throw ForbiddenException if user has no ADMIN role in DB', async () => {
      // Must set up mock for each banUser call since each consumes one mock return
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ role: 'USER' }] }) // first call
        .mockResolvedValueOnce({ rows: [{ role: 'USER' }] }); // second call

      await expect(
        modService.banUser('regular-user-uuid', 'user_cheater', 'I do not like them')
      ).rejects.toThrow(ForbiddenException);

      await expect(
        modService.banUser('regular-user-uuid', 'user_cheater', 'I do not like them')
      ).rejects.toThrow(/lacks the required 'ADMIN' role/);

      // Asserts that the TruthLog was never touched
      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if admin user not found in DB', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(
        modService.banUser('nonexistent-uuid', 'user_cheater', 'N/A')
      ).rejects.toThrow(ForbiddenException);

      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
    });
  });
});
