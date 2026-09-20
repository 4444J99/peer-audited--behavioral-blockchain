import { Pool, PoolClient } from 'pg';

/** Enlist every financial write on this client; never use pool.query inside work. */
export async function inTransaction<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  let rollbackError: Error | undefined;
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (failure) {
      // A failed rollback must evict the client, without hiding the original error.
      rollbackError = failure instanceof Error ? failure : new Error(String(failure));
    }
    throw error;
  } finally {
    client.release(rollbackError);
  }
}
