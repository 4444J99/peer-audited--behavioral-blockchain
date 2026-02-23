import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_TABLE = 'schema_migrations';
const MIGRATIONS_DIR = path.join(__dirname);

export async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
  const result = await pool.query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id`);
  return new Set(result.rows.map((r: { name: string }) => r.name));
}

export async function getPendingMigrations(pool: Pool): Promise<string[]> {
  const applied = await getAppliedMigrations(pool);
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f: string) => f.endsWith('.sql'))
    .sort();
  return files.filter((f: string) => !applied.has(f));
}

export async function runMigrations(pool: Pool): Promise<string[]> {
  await ensureMigrationsTable(pool);
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
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://styx:styx@localhost:5432/styx';
  const pool = new Pool({ connectionString: databaseUrl });

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
