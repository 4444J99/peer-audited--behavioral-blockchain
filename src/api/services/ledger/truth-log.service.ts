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
   * Theorem 2: Validates immutable sequential integrity using SHA256(index|timestamp|prev|payload)
   */
  async verifyChain(): Promise<{ valid: boolean; checked: number; corrupted: string[] }> {
    const result = await this.pool.query(
      'SELECT id, sequence_index, event_type, payload, previous_hash, current_hash, created_at FROM event_log ORDER BY sequence_index ASC',
    );

    const corrupted: string[] = [];
    let expectedPreviousHash = TruthLogService.GENESIS_HASH;

    for (const row of result.rows) {
      // Verify the previous_hash link
      if (row.previous_hash !== expectedPreviousHash) {
        corrupted.push(row.id);
      }

      // Recompute the hash (Theorem 2 logic)
      const timestamp = new Date(row.created_at).toISOString();
      const hashInput = `${row.sequence_index}|${timestamp}|${row.previous_hash}|${JSON.stringify(row.payload)}`;
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

  /**
   * Appends an event to the cryptographically linked tamper-evident log.
   * Theorem 2: Sequential Integrity using SHA256(index | timestamp | previous_hash | payload)
   */
  async appendEvent(eventType: string, payload: Record<string, any>): Promise<string> {
    const client: PoolClient = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Fetch the latest hash (using FOR UPDATE to prevent race conditions during insertion)
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

      // 2. Compute the new hash
      const payloadString = JSON.stringify(payload);
      const hashInput = `${nextIndex}|${timestamp}|${previousHash}|${payloadString}`;
      const currentHash = createHash('sha256').update(hashInput).digest('hex');

      // 3. Insert the new log entry
      const insertQuery = `
        INSERT INTO event_log (event_type, payload, previous_hash, current_hash, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      const insertRes = await client.query(insertQuery, [
        eventType,
        payload,
        previousHash,
        currentHash,
        timestamp
      ]);

      await client.query('COMMIT');
      return insertRes.rows[0].id;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

}
