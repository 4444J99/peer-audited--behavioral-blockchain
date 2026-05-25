import { Injectable, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { createHash } from 'crypto';

// Matches TruthLogService.GENESIS_HASH / APPEND_LOCK_KEY so audit events written
// here stay part of the same tamper-evident chain.
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
const TRUTH_LOG_APPEND_LOCK_KEY = 0x57_54_4c_47; // 'WTLG'

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(private readonly pool: Pool) {}

  /**
   * Appends an audit event to the tamper-evident event_log, keeping it linked to
   * the hash chain with an explicit sequence_index (so it never relies on the
   * BIGSERIAL default, which would collide with explicit-index writers). Mirrors
   * TruthLogService.appendEvent / UsersService.appendTruthLogEvent.
   */
  private async appendTruthLogEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [TRUTH_LOG_APPEND_LOCK_KEY]);

      const latestRes = await client.query(
        `SELECT sequence_index, current_hash FROM event_log ORDER BY sequence_index DESC LIMIT 1 FOR UPDATE`,
      );
      const previousHash = latestRes.rows.length > 0 ? latestRes.rows[0].current_hash : GENESIS_HASH;
      const nextIndex = latestRes.rows.length > 0 ? parseInt(latestRes.rows[0].sequence_index, 10) + 1 : 1;
      const timestamp = new Date().toISOString();

      const payloadString = JSON.stringify(payload);
      const hashInput = `${nextIndex}|${eventType}|${timestamp}|${previousHash}|${payloadString}`;
      const currentHash = createHash('sha256').update(hashInput).digest('hex');

      await client.query(
        `INSERT INTO event_log (sequence_index, event_type, payload, previous_hash, current_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [nextIndex, eventType, payload, previousHash, currentHash, timestamp],
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

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
      // Scope strictly to THIS user's own account. The previous query joined
      // users on account_id, which would over-return every entry for any user
      // sharing the same account_id. Bind the requesting user's account directly.
      this.pool.query(
        `SELECT e.* FROM entries e
         WHERE e.debit_account_id = (SELECT account_id FROM users WHERE id = $1)
            OR e.credit_account_id = (SELECT account_id FROM users WHERE id = $1)`,
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
    // 1. Anonymize user record (retain for ledger integrity, scrub PII).
    //    last_known_state is geolocation-derived PII, so it is cleared too.
    await this.pool.query(
      `UPDATE users SET
        email = $2,
        password_hash = NULL,
        last_known_state = NULL,
        status = 'DELETED',
        deletion_requested_at = NULL
       WHERE id = $1`,
      [userId, `deleted-${userId}@anonymized.styx`],
    );

    // 2. Delete notifications (non-essential, pure PII: titles/bodies).
    await this.pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);

    // 3. Scrub PII from contract metadata (keep contract records for ledger integrity).
    await this.pool.query(
      `UPDATE contracts SET metadata = '{}'::jsonb WHERE user_id = $1`,
      [userId],
    );

    // 4. Redact proof PII. The proof ROWS are retained (they are referenced by the
    //    fury/audit and hash trail) but every field that points at or describes the
    //    user's media/device is nulled: stored media URIs, the masked copy, device
    //    metadata, the camera challenge token and the metadata hash.
    await this.pool.query(
      `UPDATE proofs SET
         media_uri = NULL,
         masked_media_uri = NULL,
         device_metadata = NULL,
         challenge_token = NULL,
         metadata_hash = NULL
       WHERE user_id = $1`,
      [userId],
    );

    // 5. Redact raw health oracle payloads (biometric PII). The row + accepted/
    //    reason flags are kept for integrity, but the raw payload JSON is emptied.
    await this.pool.query(
      `UPDATE health_oracle_samples SET payload = '{}'::jsonb WHERE user_id = $1`,
      [userId],
    );

    // 6. Do NOT delete or mutate ledger entries or event_log — financial integrity
    //    requires retention under GDPR Article 6(1)(c) (legal obligation), and
    //    event_log is append-only/immutable (DB trigger). These rows are linked by
    //    id/user_id but carry no free-text personal data once the above is scrubbed.

    // 7. Log the deletion event as a properly-chained, append-only audit entry
    //    (explicit sequence_index + real hash links, not 'n/a' — the latter both
    //    broke the chain and relied on the BIGSERIAL default, risking a unique
    //    sequence_index collision with explicit-index writers).
    await this.appendTruthLogEvent('GDPR_ERASURE_COMPLETED', {
      userId,
      anonymizedAt: new Date().toISOString(),
    });

    this.logger.log(`GDPR erasure completed for user ${userId}`);
  }
}
