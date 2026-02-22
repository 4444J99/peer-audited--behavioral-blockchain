import { Injectable, ForbiddenException } from '@nestjs/common';
import { TruthLogService } from '../ledger/truth-log.service';

@Injectable()
export class ModerationService {
  constructor(private readonly truthLog: TruthLogService) {}

  /**
   * Permanently exiles a user from the platform by writing an irrevocable BANNED event.
   * Enforces zero-trust access: only explicit system admins can invoke this.
   */
  async banUser(
    adminId: string, 
    targetUserId: string, 
    reason: string
  ): Promise<{ status: string; eventId: string }> {
    
    // Hardcoded mock check for Phase Delta. In prod, check JWT Roles.
    if (!adminId.startsWith('ADMIN_')) {
      throw new ForbiddenException(
        `Moderation Error: User ${adminId} lacks the required 'ADMIN' role to execute a system ban.`
      );
    }

    const payload = {
      targetUserId,
      reason,
      executedBy: adminId,
      action: 'PERMANENT_EXILE'
    };

    // Commit to the immutable log
    const logResult = await this.truthLog.appendEvent('ACCOUNT_BANNED', payload);

    return {
      status: 'USER_PERMANENTLY_BANNED',
      eventId: logResult
    };
  }
}
