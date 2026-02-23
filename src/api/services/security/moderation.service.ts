import { Injectable, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { TruthLogService } from '../ledger/truth-log.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly truthLog: TruthLogService,
    private readonly pool: Pool,
  ) {}

  /**
   * Permanently exiles a user from the platform by writing an irrevocable BANNED event.
   * Enforces zero-trust access: verifies admin role via database lookup.
   */
  async banUser(
    adminId: string,
    targetUserId: string,
    reason: string
  ): Promise<{ status: string; eventId: string }> {

    // Verify admin role via database lookup (not string prefix)
    const adminResult = await this.pool.query(
      'SELECT role FROM users WHERE id = $1',
      [adminId],
    );
    if (adminResult.rows.length === 0 || adminResult.rows[0].role !== 'ADMIN') {
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

    // Enforce ban in user status — contracts service checks user.status
    await this.pool.query(
      `UPDATE users SET status = 'BANNED' WHERE id = $1`,
      [targetUserId],
    );

    return {
      status: 'USER_PERMANENTLY_BANNED',
      eventId: logResult
    };
  }
}
