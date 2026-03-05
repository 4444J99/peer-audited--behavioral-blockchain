import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(private readonly pool: Pool) {}

  /** GDPR Article 20: Export all user data in a machine-readable format. */
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const [user, contracts, proofs, entries, notifications, attestations] = await Promise.all([
      this.pool.query(
        'SELECT id, email, integrity_score, role, status, created_at FROM users WHERE id = $1',
        [userId],
      ),
      this.pool.query(
        'SELECT id, oath_category, verification_method, stake_amount, status, duration_days, started_at, ends_at, created_at FROM contracts WHERE user_id = $1',
        [userId],
      ),
      this.pool.query(
        'SELECT id, contract_id, status, submitted_at FROM proofs WHERE user_id = $1',
        [userId],
      ),
      this.pool.query(
        `SELECT e.* FROM entries e
         JOIN accounts a ON (e.debit_account_id = a.id OR e.credit_account_id = a.id)
         JOIN users u ON u.account_id = a.id
         WHERE u.id = $1`,
        [userId],
      ),
      this.pool.query(
        'SELECT id, type, title, body, created_at FROM notifications WHERE user_id = $1',
        [userId],
      ),
      this.pool.query(
        'SELECT a.* FROM attestations a JOIN contracts c ON a.contract_id = c.id WHERE c.user_id = $1',
        [userId],
      ),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user: user.rows[0] || null,
      contracts: contracts.rows,
      proofs: proofs.rows,
      ledgerEntries: entries.rows,
      notifications: notifications.rows,
      attestations: attestations.rows,
    };
  }

  /**
   * GDPR Article 17: Process pending deletions after 30-day cooling period.
   * Anonymizes PII but retains ledger entries for financial integrity (Article 6(1)(c)).
   */
  async processPendingDeletions(): Promise<{ processed: number; skipped: number }> {
    const pendingUsers = await this.pool.query(
      `SELECT id FROM users
       WHERE status = 'PENDING_DELETION'
       AND deletion_requested_at IS NOT NULL
       AND deletion_requested_at <= NOW() - INTERVAL '30 days'`,
    );

    let processed = 0;
    let skipped = 0;

    for (const row of pendingUsers.rows) {
      try {
        await this.anonymizeUser(row.id);
        processed++;
      } catch (err) {
        this.logger.error(
          `Failed to process deletion for user ${row.id}: ${err instanceof Error ? err.message : err}`,
        );
        skipped++;
      }
    }

    return { processed, skipped };
  }

  private async anonymizeUser(userId: string): Promise<void> {
    // 1. Anonymize user record (retain for ledger integrity, scrub PII)
    await this.pool.query(
      `UPDATE users SET
        email = $2,
        password_hash = NULL,
        status = 'DELETED',
        deletion_requested_at = NULL
       WHERE id = $1`,
      [userId, `deleted-${userId}@anonymized.styx`],
    );

    // 2. Delete notifications (non-essential, pure PII)
    await this.pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);

    // 3. Scrub PII from contract metadata (keep contract records for ledger integrity)
    await this.pool.query(
      `UPDATE contracts SET metadata = '{}'::jsonb WHERE user_id = $1`,
      [userId],
    );

    // 4. Do NOT delete ledger entries or event_log — financial integrity requires
    //    retention under GDPR Article 6(1)(c) (legal obligation)

    // 5. Log the deletion event
    await this.pool.query(
      `INSERT INTO event_log (event_type, payload, previous_hash, current_hash)
       VALUES ('GDPR_ERASURE_COMPLETED', $1, 'n/a', 'n/a')`,
      [JSON.stringify({ userId, anonymizedAt: new Date().toISOString() })],
    );

    this.logger.log(`GDPR erasure completed for user ${userId}`);
  }
}
