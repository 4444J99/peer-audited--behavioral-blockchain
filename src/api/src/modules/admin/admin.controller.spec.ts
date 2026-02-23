import { AdminController } from './admin.controller';
import { ModerationService } from '../../../services/security/moderation.service';
import { HoneypotInjectorService } from '../../../services/intelligence/honeypot.service';
import { ContractsService } from '../contracts/contracts.service';

describe('AdminController', () => {
  let controller: AdminController;

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
    controller = new AdminController(mockModeration, mockHoneypot, mockContracts);
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

      const result = await controller.banUser('target-user-1', {
        adminId: 'ADMIN_root',
        reason: 'Repeated fraud violations',
      });

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
        controller.banUser('target-user-1', {
          adminId: 'non-admin',
          reason: 'test',
        }),
      ).rejects.toThrow(/ADMIN role/);
    });
  });
});
