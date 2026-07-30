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

  const fileSet = new Set(files);
  for (const a of applied) {
    if (!fileSet.has(a)) {
      throw new Error(`Schema drift detected: Applied migration ${a} is missing from the filesystem.`);
    }
  }

  const pending = files.filter((f: string) => !applied.has(f));
  const appliedArr = Array.from(applied).sort();
  const lastApplied = appliedArr.length > 0 ? appliedArr[appliedArr.length - 1] : '';
  
  for (const p of pending) {
    if (lastApplied && p < lastApplied) {
      throw new Error(`Schema drift detected: Pending migration ${p} is older than applied migration ${lastApplied}.`);
    }
  }

  return pending;
}

/**
 * Detects a database that was provisioned by a legacy consolidated schema.sql
 * init script (historically mounted at /docker-entrypoint-initdb.d/) but never
 * tracked in schema_migrations. In that state part of the schema already
 * exists, yet the runner would see every migration as "pending" and crash on
 * the first one: 001_initial_schema.sql issues a bare `CREATE TYPE
 * account_type` / `CREATE TABLE accounts` with no IF NOT EXISTS, producing the
 * exact "relation already exists" schema-drift failure reported in #28.
 */
export async function isSchemaPreInitialized(pool: Pool): Promise<boolean> {
  const result = await pool.query(`SELECT to_regclass($1) AS reg`, [
    SCHEMA_SENTINEL_TABLE,
  ]);
  return result.rows[0]?.reg != null;
}

// Matches `CREATE TABLE [IF NOT EXISTS] [schema.]name` — CREATE TYPE / INDEX /
// TRIGGER never match, and `CREATE TEMP TABLE` is excluded by the adjacency of
// CREATE and TABLE. Group 1 is the (optionally quoted) table name.
const CREATE_TABLE_RE =
  /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_$]*)\s*\.\s*)?("[^"]+"|[A-Za-z_][A-Za-z0-9_$]*)/gi;

/**
 * The table names a migration file introduces, extracted from its SQL text.
 * Unquoted identifiers are lowercased (Postgres folds them), quoted ones kept
 * verbatim, duplicates removed.
 */
export function extractCreatedTables(sql: string): string[] {
  const tables = new Set<string>();
  for (const match of sql.matchAll(CREATE_TABLE_RE)) {
    const raw = match[1];
    tables.add(raw.startsWith('"') ? raw.slice(1, -1) : raw.toLowerCase());
  }
  return Array.from(tables);
}

/**
 * True when every named table exists in the public schema. Vacuously true for
 * an empty list (no information_schema round-trip).
 */
export async function allTablesExist(pool: Pool, tables: string[]): Promise<boolean> {
  if (tables.length === 0) return true;
  const result = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [tables],
  );
  const found = new Set(result.rows.map((r: { table_name: string }) => r.table_name));
  return tables.every((t) => found.has(t));
}

/**
 * Adopts a legacy schema.sql-provisioned database as a migration baseline by
 * stamping — WITHOUT executing — only the contiguous prefix of migration files
 * whose CREATE TABLE objects verifiably exist in information_schema. The old
 * behavior (stamp EVERY file) silently skipped every table schema.sql never
 * knew about, so migration-only tables could never come into existence.
 *
 * Rules:
 * - A file whose created tables all exist is stamped as applied.
 * - A file that creates no tables (ALTER-only) is vacuously covered while
 *   still inside the prefix: schema.sql was the consolidated snapshot, so
 *   column-level changes in the covered range are already present.
 * - The FIRST file with any missing table ends the prefix; it and everything
 *   after it are left unstamped so runMigrations executes them (they lean on
 *   IF NOT EXISTS, so replay over a partial schema is safe). Stamping past a
 *   gap would also violate getPendingMigrations' ordering invariant (a pending
 *   migration older than an applied one is reported as drift).
 *
 * Idempotent via ON CONFLICT, so a partially-stamped baseline is safe to
 * re-run.
 */
export async function baselineFromExistingSchema(pool: Pool): Promise<string[]> {
  const files = listMigrationFiles();
  const stamped: string[] = [];
  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    const tables = extractCreatedTables(sql);
    if (!(await allTablesExist(pool, tables))) {
      break;
    }
    await pool.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [file],
    );
    stamped.push(file);
  }
  console.log(
    `Baselined ${stamped.length}/${files.length} migration(s) whose schema objects already exist; the rest will execute.`,
  );
  return stamped;
}

export async function runMigrations(pool: Pool): Promise<string[]> {
  await ensureMigrationsTable(pool);

  // Drift guard: when a legacy schema.sql init already provisioned (part of)
  // the schema but nothing is tracked yet, adopt the covered prefix as the
  // baseline rather than replaying migrations that would collide with existing
  // objects. On a truly fresh database the sentinel is absent, nothing is
  // baselined, and the FULL migration chain executes.
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
  const connectionString = process.env.MIGRATION_DATABASE_URL || resolveDatabaseUrl();
  const pool = new Pool({ connectionString });

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
