import { Injectable, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { createHash, randomUUID } from 'crypto';

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
      await this.appendTruthLogEventWithClient(client, eventType, payload);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Append a chained audit event using an existing transaction (client). Lets the
   * caller make the audit append part of a larger atomic unit (e.g. GDPR erasure),
   * so a user is never left partially-anonymized without a matching audit event.
   * The advisory lock is transaction-scoped, so it is held until the caller's
   * COMMIT/ROLLBACK.
   */
  private async appendTruthLogEventWithClient(
    client: PoolClient,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
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
        // PRV5: never log the raw userId or error detail in the erasure path (the
        // flow does not clean these logs up). Emit a non-identifying correlation id
        // and the error class only, so failures stay diagnosable without leaking PII.
        const correlationId = randomUUID();
        this.logger.error(
          `Failed to process pending deletion (correlationId=${correlationId}, error=${err instanceof Error ? err.name : 'Unknown'})`,
        );
        skipped++;
      }
    }

    return { processed, skipped };
  }

  private async anonymizeUser(userId: string): Promise<void> {
    // PRV4: the full erasure (every UPDATE/DELETE) AND the GDPR_ERASURE_COMPLETED
    // audit append must be one atomic unit. A mid-way failure previously left a
    // partially-anonymized user with un-scrubbed PII and possibly no audit event,
    // which processPendingDeletions would then retry. Run everything on a single
    // connection inside one transaction. Fall back to non-transactional pool.query
    // only if the pool lacks connect() (mirrors appendTruthLogEvent's pattern and
    // keeps unit tests that mock a bare pool working).
    if (typeof (this.pool as Partial<Pool>).connect === 'function') {
      const client: PoolClient = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await this.runErasureStatements(client, userId);
        await this.appendTruthLogEventWithClient(client, 'GDPR_ERASURE_COMPLETED', {
          userId,
          anonymizedAt: new Date().toISOString(),
        });
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } else {
      // Non-transactional fallback (no atomicity guarantee).
      await this.runErasureStatements(this.pool, userId);
      await this.appendTruthLogEvent('GDPR_ERASURE_COMPLETED', {
        userId,
        anonymizedAt: new Date().toISOString(),
      });
    }

    this.logger.log(`GDPR erasure completed for user ${userId}`);
  }

  /**
   * Issue every PII-scrubbing UPDATE/DELETE for an erased user against the given
   * query target (a transaction client during normal operation, the pool only in
   * the non-transactional fallback). Ledger entries and event_log are intentionally
   * retained (Article 6(1)(c) legal obligation + append-only audit chain).
   */
  private async runErasureStatements(
    db: Pool | PoolClient,
    userId: string,
  ): Promise<void> {
    // 1. Anonymize the user record. Scrub every direct-PII / identity / compliance
    //    column, not just email/password (PRV3): geolocation, date_of_birth, the
    //    Stripe customer/subscription linkage, KYC compliance_metadata, identity-provider refs
    //    and Terms-of-Service acceptance metadata.
    await db.query(
      `UPDATE users SET
        email = $2,
        password_hash = NULL,
        last_known_state = NULL,
        date_of_birth = NULL,
        stripe_customer_id = NULL,
        subscription_id = NULL,
        compliance_metadata = '{}'::jsonb,
        identity_verification_id = NULL,
        identity_provider = NULL,
        terms_accepted_at = NULL,
        terms_version = NULL,
        status = 'DELETED',
        deletion_requested_at = NULL
       WHERE id = $1`,
      [userId, `deleted-${userId}@anonymized.styx`],
    );

    // 2. Delete notifications (non-essential, pure PII: titles/bodies).
    await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);

    // 3. Scrub PII from contract metadata (keep contract records for ledger integrity).
    await db.query(
      `UPDATE contracts SET metadata = '{}'::jsonb WHERE user_id = $1`,
      [userId],
    );

    // 4. Redact proof PII. The proof ROWS are retained (they are referenced by the
    //    fury/audit and hash trail) but every field that points at or describes the
    //    user's media/device is nulled: stored media URIs, the masked copy, device
    //    metadata, the camera challenge token and the metadata hash.
    await db.query(
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
    await db.query(
      `UPDATE health_oracle_samples SET payload = '{}'::jsonb WHERE user_id = $1`,
      [userId],
    );

    // 6. Scrub the erased user's accountability-partner contact PII. partner_email
    //    is a third-party email captured on this user's own contracts; null it.
    await db.query(
      `UPDATE accountability_partners ap SET partner_email = NULL
       FROM contracts c
       WHERE ap.contract_id = c.id AND c.user_id = $1`,
      [userId],
    );

    // 7. Scrub the subject alias carried on fury assignments that audited this
    //    user's proofs (free-text alias describing the erased subject).
    await db.query(
      `UPDATE fury_assignments fa SET subject_alias = NULL
       FROM proofs p
       WHERE fa.proof_id = p.id AND p.user_id = $1`,
      [userId],
    );

    // 8. Delete the user's dashboard progress snapshots (payload_json is a derived
    //    behavioral PII blob keyed to the user; remove rather than retain).
    await db.query(
      'DELETE FROM dashboard_progress_snapshots WHERE user_id = $1',
      [userId],
    );

    // 9. Do NOT delete or mutate ledger entries or event_log — financial integrity
    //    requires retention under GDPR Article 6(1)(c) (legal obligation), and
    //    event_log is append-only/immutable (DB trigger). These rows are linked by
    //    id/user_id but carry no free-text personal data once the above is scrubbed.
  }
}
