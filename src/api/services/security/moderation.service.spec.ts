import { ModerationService } from './moderation.service';
import { TruthLogService } from '../ledger/truth-log.service';
import { ForbiddenException } from '@nestjs/common';

describe('ModerationService', () => {
  let modService: ModerationService;
  
  const mockTruthLog = {
    appendEvent: jest.fn(),
  } as unknown as TruthLogService;

  beforeEach(() => {
    modService = new ModerationService(mockTruthLog);
    jest.clearAllMocks();
  });

  describe('banUser', () => {
    it('should successfully log an ACCOUNT_BANNED event if called by an ADMIN', async () => {
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValueOnce('evt-ban-123');

      const result = await modService.banUser('ADMIN_JDoe', 'user_cheater', 'Failed 3 audits');

      expect(result.status).toBe('USER_PERMANENTLY_BANNED');
      expect(result.eventId).toBe('evt-ban-123');

      const appendCall = (mockTruthLog.appendEvent as jest.Mock).mock.calls[0];
      expect(appendCall[0]).toBe('ACCOUNT_BANNED');
      expect(appendCall[1].targetUserId).toBe('user_cheater');
      expect(appendCall[1].executedBy).toBe('ADMIN_JDoe');
      expect(appendCall[1].action).toBe('PERMANENT_EXILE');
    });

    it('should throw ForbiddenException if a non-admin attempts a ban', async () => {
      await expect(
        modService.banUser('REGULAR_USER', 'user_cheater', 'I do not like them')
      ).rejects.toThrow(ForbiddenException);

      await expect(
        modService.banUser('REGULAR_USER', 'user_cheater', 'I do not like them')
      ).rejects.toThrow(/lacks the required 'ADMIN' role/);
      
      // Asserts that the TruthLog was never touched
      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
    });
  });
});
