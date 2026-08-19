import { Injectable, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { createHash, randomUUID } from 'crypto';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
const TRUTH_LOG_APPEND_LOCK_KEY = 0x57_54_4c_47;

// How long a DELETE request sits before the sweep executes it.
//
// CCPA §1798.130(a)(2) gives the business 45 days to respond, which is a
// ceiling, not a target — the erasure has to have happened by then. This holds
// the request briefly so a user who submitted by mistake, or whose account is
// compromised, has a window to contact support before the data is gone, while
// leaving a wide margin under the statutory deadline.
//
// The sibling GDPR path (gdpr.service.ts) uses 30 days for the same reason. 7
// is chosen here rather than 30 because CCPA's window is 45 days, not the
// GDPR-style month, so a 30-day hold would leave only 15 days of slack for a
// failed sweep to be noticed and retried. Adjust with counsel — this is a
// policy parameter, not a technical constraint.
const CCPA_DELETION_GRACE_DAYS = 7;

export type CCPADeletionRequest = {
  userId: string;
  requestType: 'DELETE' | 'OPT_OUT';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'DENIED';
  requestedAt: Date;
  completedAt?: Date;
  denialReason?: string;
};

export type PersonalInfoCategory = {
  category: string;
  '收集目的': string;
  thirdParties: string[];
  retentionPeriod: string;
};

export type DoNotSellRequest = {
  userId: string;
  optedOut: boolean;
  requestedAt: Date;
};

@Injectable()
export class CcpaService {
  private readonly logger = new Logger(CcpaService.name);

  constructor(private readonly pool: Pool) {}

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

  async requestDataDeletion(userId: string): Promise<CCPADeletionRequest> {
    const request: CCPADeletionRequest = {
      userId,
      requestType: 'DELETE',
      status: 'PENDING',
      requestedAt: new Date(),
    };

    await this.pool.query(
      `INSERT INTO ccpa_deletion_requests (user_id, request_type, status, requested_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, request.requestType, request.status, request.requestedAt],
    );

    this.logger.log(`CCPA deletion request created for user ${userId}`);
    return request;
  }

  /**
   * Execute every DELETE request that has cleared the grace window.
   *
   * Without this, `processDeletionRequest` had no callers at all: a California
   * resident could submit a deletion request, it was recorded `PENDING`, and
   * nothing ever ran the erasure. That is worse than an absent feature — it
   * reports success to the user and to any compliance review while retaining
   * the data indefinitely, past the CCPA §1798.130(a)(2) deadline.
   *
   * Mirrors `GdprService.processPendingDeletions`, including its failure
   * posture: one bad row must not abort the sweep, and the erasure path never
   * logs the raw userId or error detail, because the flow does not come back to
   * clean those logs up. Failures surface as a non-identifying correlation id
   * plus the error class.
   *
   * OPT_OUT requests are deliberately excluded — those are do-not-sell flags,
   * not erasures, and are handled by `optOutOfSale`.
   */
  async processPendingDeletions(): Promise<{ processed: number; skipped: number }> {
    const pending = await this.pool.query(
      `SELECT id FROM ccpa_deletion_requests
       WHERE status = 'PENDING'
         AND request_type = 'DELETE'
         AND requested_at <= NOW() - ($1 || ' days')::interval
       ORDER BY requested_at ASC`,
      [CCPA_DELETION_GRACE_DAYS],
    );

    let processed = 0;
    let skipped = 0;

    for (const row of pending.rows) {
      try {
        await this.processDeletionRequest(row.id);
        processed++;
      } catch (err) {
        const correlationId = randomUUID();
        this.logger.error(
          `Failed to process CCPA deletion request (correlationId=${correlationId}, error=${err instanceof Error ? err.name : 'Unknown'})`,
        );
        skipped++;
      }
    }

    return { processed, skipped };
  }

  async processDeletionRequest(requestId: string): Promise<CCPADeletionRequest> {
    const result = await this.pool.query(
      `UPDATE ccpa_deletion_requests SET status = 'PROCESSING' WHERE id = $1 RETURNING *`,
      [requestId],
    );

    if (result.rows.length === 0) {
      throw new Error(`Deletion request ${requestId} not found`);
    }

    const row = result.rows[0];
    const userId = row.user_id;

    // The 'PROCESSING' stamp above is its own statement, outside the erasure
    // transaction, so a rollback does not undo it. Left alone, a failed erasure
    // strands the request at 'PROCESSING' forever: the sweep only picks up
    // 'PENDING', so nothing retries and the user's data is never deleted —
    // silently blowing the CCPA §1798.130(a)(2) deadline. Returning it to
    // 'PENDING' is safe precisely because the erasure is transactional: on
    // failure the data is untouched, so the next sweep can retry cleanly.
    try {
      if (typeof (this.pool as Partial<Pool>).connect === 'function') {
        const client: PoolClient = await this.pool.connect();
        try {
          await client.query('BEGIN');
          await this.runErasureStatements(client, userId);
          await this.appendTruthLogEventWithClient(client, 'CCPA_DELETION_COMPLETED', {
            userId,
            requestId,
            anonymizedAt: new Date().toISOString(),
          });
          await client.query('COMMIT');
        } catch (e) {
          // A failed rollback must never mask the error that caused it.
          try {
            await client.query('ROLLBACK');
          } catch {
            /* swallowed deliberately — the original error is rethrown below */
          }
          throw e;
        } finally {
          client.release();
        }
      } else {
        await this.runErasureStatements(this.pool, userId);
        await this.appendTruthLogEvent('CCPA_DELETION_COMPLETED', {
          userId,
          requestId,
          anonymizedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      try {
        await this.pool.query(
          `UPDATE ccpa_deletion_requests SET status = 'PENDING' WHERE id = $1 AND status = 'PROCESSING'`,
          [requestId],
        );
      } catch {
        /* best-effort: never mask the erasure failure with a bookkeeping failure */
      }
      throw e;
    }

    const completedAt = new Date();
    await this.pool.query(
      `UPDATE ccpa_deletion_requests SET status = 'COMPLETED', completed_at = $2 WHERE id = $1`,
      [requestId, completedAt],
    );

    this.logger.log(`CCPA deletion completed for request ${requestId}`);

    return {
      userId,
      requestType: row.request_type,
      status: 'COMPLETED',
      requestedAt: row.requested_at,
      completedAt,
    };
  }

  private async runErasureStatements(db: Pool | PoolClient, userId: string): Promise<void> {
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

    await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);

    await db.query(
      `UPDATE contracts SET metadata = '{}'::jsonb WHERE user_id = $1`,
      [userId],
    );

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

    await db.query(
      `UPDATE health_oracle_samples SET payload = '{}'::jsonb WHERE user_id = $1`,
      [userId],
    );

    await db.query(
      `UPDATE accountability_partners ap SET partner_email = NULL
       FROM contracts c
       WHERE ap.contract_id = c.id AND c.user_id = $1`,
      [userId],
    );

    await db.query(
      `UPDATE fury_assignments fa SET subject_alias = NULL
       FROM proofs p
       WHERE fa.proof_id = p.id AND p.user_id = $1`,
      [userId],
    );

    await db.query(
      'DELETE FROM dashboard_progress_snapshots WHERE user_id = $1',
      [userId],
    );
  }

  async optOutSale(userId: string): Promise<DoNotSellRequest> {
    await this.pool.query(
      `UPDATE users SET compliance_metadata = jsonb_set(
        COALESCE(compliance_metadata, '{}'::jsonb),
        '{ccpa_do_not_sell}',
        'true'::jsonb
      ) WHERE id = $1`,
      [userId],
    );

    const request: DoNotSellRequest = {
      userId,
      optedOut: true,
      requestedAt: new Date(),
    };

    this.logger.log(`CCPA opt-out of sale recorded for user ${userId}`);
    return request;
  }

  async getPersonalInfoCategories(): Promise<PersonalInfoCategory[]> {
    return [
      {
        category: 'Identifiers (email, phone)',
        '收集目的': 'Account management and identity verification',
        thirdParties: ['Stripe'],
        retentionPeriod: 'Until deletion request',
      },
      {
        category: 'Health data (biometrics, attestations)',
        '收集目的': 'Proof verification and contract integrity',
        thirdParties: [],
        retentionPeriod: 'Contract duration + 7 years',
      },
      {
        category: 'Commercial info (contracts, stakes)',
        '收集目的': 'Financial integrity and regulatory compliance',
        thirdParties: ['Stripe'],
        retentionPeriod: '7 years (tax/legal)',
      },
      {
        category: 'Internet activity (app usage, proof submissions)',
        '收集目的': 'Fraud detection and platform security',
        thirdParties: [],
        retentionPeriod: '2 years',
      },
      {
        category: 'Geolocation (from proofs)',
        '收集目的': 'Geofence compliance for proof verification',
        thirdParties: [],
        retentionPeriod: 'Contract duration',
      },
    ];
  }

  async verifyCaliforniaResident(userId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT compliance_metadata FROM users WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return false;
    }

    const metadata = result.rows[0].compliance_metadata;
    return metadata?.state === 'CA';
  }

  async getDeletionRequestStatus(userId: string): Promise<CCPADeletionRequest | null> {
    const result = await this.pool.query(
      `SELECT * FROM ccpa_deletion_requests WHERE user_id = $1 ORDER BY requested_at DESC LIMIT 1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      userId: row.user_id,
      requestType: row.request_type,
      status: row.status,
      requestedAt: row.requested_at,
      completedAt: row.completed_at || undefined,
      denialReason: row.denial_reason || undefined,
    };
  }
}
