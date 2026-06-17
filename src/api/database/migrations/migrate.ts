import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { resolveDatabaseUrl } from '../../src/config/runtime';

const MIGRATIONS_TABLE = 'schema_migrations';
const MIGRATIONS_DIR = path.join(__dirname);

// Sentinel table created both by the very first migration (001) and by the
// consolidated schema.sql init script. Its presence means the database has
// already been provisioned by *some* path (an initdb-mounted schema.sql or a
// prior migration run), even when schema_migrations is still empty.
const SCHEMA_SENTINEL_TABLE = 'accounts';

export async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export function listMigrationFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f: string) => f.endsWith('.sql'))
    .sort();
}

export async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
  const result = await pool.query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id`);
  return new Set(result.rows.map((r: { name: string }) => r.name));
}

export async function getPendingMigrations(pool: Pool): Promise<string[]> {
  const applied = await getAppliedMigrations(pool);
  const files = listMigrationFiles();
  return files.filter((f: string) => !applied.has(f));
}

/**
 * Detects a database that was provisioned by the consolidated schema.sql init
 * script (mounted at /docker-entrypoint-initdb.d/) but never tracked in
 * schema_migrations. In that state the schema already exists, yet the runner
 * would see every migration as "pending" and crash on the first one:
 * 001_initial_schema.sql issues a bare `CREATE TYPE account_type` /
 * `CREATE TABLE accounts` with no IF NOT EXISTS, producing the exact
 * "relation already exists" schema-drift failure reported in #28.
 */
export async function isSchemaPreInitialized(pool: Pool): Promise<boolean> {
  const result = await pool.query(`SELECT to_regclass($1) AS reg`, [
    SCHEMA_SENTINEL_TABLE,
  ]);
  return result.rows[0]?.reg != null;
}

/**
 * Stamps every known migration file as applied WITHOUT executing it. Used once,
 * when the schema was provisioned by schema.sql but schema_migrations is empty,
 * so the runner adopts that schema as its baseline instead of replaying
 * migrations against tables that already exist. Idempotent via ON CONFLICT, so
 * a partially-stamped baseline is safe to re-run.
 */
export async function baselineFromExistingSchema(pool: Pool): Promise<string[]> {
  const files = listMigrationFiles();
  for (const file of files) {
    await pool.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [file],
    );
  }
  console.log(
    `Baselined ${files.length} migration(s) from pre-initialized schema.sql.`,
  );
  return files;
}

export async function runMigrations(pool: Pool): Promise<string[]> {
  await ensureMigrationsTable(pool);

  // Drift guard: when schema.sql already provisioned the schema (a fresh
  // `docker compose up`) but nothing is tracked yet, adopt it as the baseline
  // rather than replaying migrations that would collide with existing objects.
  const tracked = await getAppliedMigrations(pool);
  if (tracked.size === 0 && (await isSchemaPreInitialized(pool))) {
    await baselineFromExistingSchema(pool);
  }

  const pending = await getPendingMigrations(pool);

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return [];
  }

  const applied: string[] = [];
  for (const file of pending) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`,
        [file],
      );
      await client.query('COMMIT');
      console.log(`Applied: ${file}`);
      applied.push(file);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Failed to apply ${file}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  return applied;
}

// CLI entry point — run directly with `tsx database/migrations/migrate.ts`
if (require.main === module) {
  const pool = new Pool({ connectionString: resolveDatabaseUrl() });

  runMigrations(pool)
    .then((applied) => {
      console.log(`Done. ${applied.length} migration(s) applied.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
