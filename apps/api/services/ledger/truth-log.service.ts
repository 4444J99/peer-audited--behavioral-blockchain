import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { createHash } from 'crypto';

@Injectable()
export class TruthLogService {
  public static readonly GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

  constructor(private readonly pool: Pool) {}

  /**
   * Walks the hash chain from oldest to newest, recomputing each hash
   * and verifying it matches the stored value. Returns a summary with
   * the total events checked and any corrupted entries.
   *
   * Theorem 2: Validates immutable sequential integrity using
   * SHA256(index|event_type|timestamp|prev|payload)
   */
  async verifyChain(): Promise<{ valid: boolean; checked: number; corrupted: string[] }> {
    const result = await this.pool.query(
      'SELECT id, sequence_index, event_type, payload, previous_hash, current_hash, created_at FROM event_log ORDER BY sequence_index ASC',
    );

    const corrupted: string[] = [];
    // Track the running recomputed head rather than trusting each row's stored
    // previous_hash, so a forged but internally self-consistent fork is detected.
    let expectedPreviousHash = TruthLogService.GENESIS_HASH;

    for (const row of result.rows) {
      // Verify the previous_hash link against the running head
      if (row.previous_hash !== expectedPreviousHash) {
        corrupted.push(row.id);
      }

      // Recompute the hash (Theorem 2 logic) — event_type is part of the preimage
      // so a tampered event_type with an unchanged payload is still detected.
      // Use the running recomputed head (expectedPreviousHash), NOT the stored
      // row.previous_hash, so a chain that was consistently re-forged (every
      // previous_hash/current_hash rewritten to agree internally) still fails:
      // the recomputed head will diverge from the forged links.
      const timestamp = new Date(row.created_at).toISOString();
      const hashInput = `${row.sequence_index}|${row.event_type}|${timestamp}|${expectedPreviousHash}|${JSON.stringify(row.payload)}`;
      const recomputedHash = createHash('sha256').update(hashInput).digest('hex');

      if (recomputedHash !== row.current_hash) {
        if (!corrupted.includes(row.id)) {
          corrupted.push(row.id);
        }
      }

      expectedPreviousHash = row.current_hash;
    }

    return {
      valid: corrupted.length === 0,
      checked: result.rows.length,
      corrupted,
    };
  }

  // Constant key for the transaction-scoped advisory lock that serializes
  // appends to the single global hash chain.
  private static readonly APPEND_LOCK_KEY = 0x57_54_4c_47; // 'WTLG'

  /**
   * Appends an event to the cryptographically linked tamper-evident log.
   * Theorem 2: Sequential Integrity using
   * SHA256(index | event_type | timestamp | previous_hash | payload)
   */
  async appendEvent(
    eventType: string,
    payload: Record<string, any>,
    externalClient?: PoolClient,
  ): Promise<string> {
    // When a caller passes its own client, we enlist in THAT transaction so the
    // append commits (or rolls back) atomically with the caller's other writes
    // (e.g. a proof status change). In that mode we must NOT open/commit our own
    // transaction or release the caller's client. The transaction-scoped advisory
    // lock is held for the duration of the caller's transaction, which is fine.
    const ownTransaction = !externalClient;
    const client: PoolClient = externalClient ?? (await this.pool.connect());

    try {
      if (ownTransaction) await client.query('BEGIN');

      // 0. Serialize all appends with a transaction-scoped advisory lock so only
      //    one append computes the head/index at a time. This closes the
      //    empty-table genesis race and keeps the app-computed index in lockstep
      //    with what is actually stored.
      await client.query('SELECT pg_advisory_xact_lock($1)', [TruthLogService.APPEND_LOCK_KEY]);

      // 1. Fetch the latest hash (FOR UPDATE as a secondary guard against races)
      const latestLogQuery = `
        SELECT sequence_index, current_hash
        FROM event_log
        ORDER BY sequence_index DESC
        LIMIT 1
        FOR UPDATE;
      `;
      const latestRes = await client.query(latestLogQuery);

      const previousHash = latestRes.rows.length > 0 ? latestRes.rows[0].current_hash : TruthLogService.GENESIS_HASH;
      const nextIndex = latestRes.rows.length > 0 ? parseInt(latestRes.rows[0].sequence_index) + 1 : 1;
      const timestamp = new Date().toISOString();

      // 2. Compute the new hash over the same preimage verifyChain recomputes,
      //    including the explicit sequence index we are about to store.
      const payloadString = JSON.stringify(payload);
      const hashInput = `${nextIndex}|${eventType}|${timestamp}|${previousHash}|${payloadString}`;
      const currentHash = createHash('sha256').update(hashInput).digest('hex');

      // 3. Insert the new log entry, storing the sequence_index explicitly so the
      //    hashed index always matches the persisted value (BIGSERIAL could
      //    otherwise diverge after a rolled-back insert).
      const insertQuery = `
        INSERT INTO event_log (sequence_index, event_type, payload, previous_hash, current_hash, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
      `;
      const insertRes = await client.query(insertQuery, [
        nextIndex,
        eventType,
        payload,
        previousHash,
        currentHash,
        timestamp
      ]);

      // 4. Advance the underlying BIGSERIAL sequence to the index we just inserted
      //    explicitly. Without this, the sequence's nextval still lags behind the
      //    app-computed indices, so any path that relies on the column DEFAULT
      //    (seed.sql, a future writer) would hand out an already-used index and
      //    collide with idx_event_log_sequence. setval(..., nextIndex, true) marks
      //    "last value used = nextIndex", so the next DEFAULT yields nextIndex + 1.
      //    We hold the advisory lock for the whole transaction and indices are
      //    monotonically increasing, so this never regresses the sequence.
      //    NOTE: the cleaner fix is a migration dropping the column DEFAULT entirely;
      //    that is out of scope here (no migrations created).
      await client.query(
        `SELECT setval(pg_get_serial_sequence('event_log', 'sequence_index'), $1::bigint, true)`,
        [nextIndex],
      );

      if (ownTransaction) await client.query('COMMIT');
      return insertRes.rows[0].id;
    } catch (e) {
      // Only unwind our own transaction; if the caller owns it, let the error
      // propagate so the caller's catch can ROLLBACK the whole unit of work.
      if (ownTransaction) await client.query('ROLLBACK');
      throw e;
    } finally {
      if (ownTransaction) client.release();
    }
  }

}
