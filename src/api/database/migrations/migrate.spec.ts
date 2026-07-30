import {
  allTablesExist,
  baselineFromExistingSchema,
  ensureMigrationsTable,
  extractCreatedTables,
  getAppliedMigrations,
  getPendingMigrations,
  isSchemaPreInitialized,
  listMigrationFiles,
  runMigrations,
} from './migrate';

// Mock fs and path to control migration file discovery
jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

import * as fs from 'fs';

const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  query: mockQuery,
  connect: mockConnect,
} as any;

/**
 * Routes pool.query calls by SQL shape instead of brittle call-order chains.
 * - `existingTables` plays the role of information_schema.tables (public).
 * - `stamped` accumulates names INSERTed into schema_migrations via the
 *   baseline path, and is served back by getAppliedMigrations, so the
 *   "tracked → baseline → pending" flow behaves like a real database.
 */
function routeQueries(options: {
  existingTables: string[];
  sentinelPresent: boolean;
  stamped?: string[];
}): string[] {
  const existing = new Set(options.existingTables);
  const stamped = options.stamped ?? [];

  mockQuery.mockImplementation(async (text: string, params?: unknown[]) => {
    if (text.includes('CREATE TABLE IF NOT EXISTS schema_migrations')) {
      return { rows: [] };
    }
    if (text.includes('to_regclass')) {
      return { rows: [{ reg: options.sentinelPresent ? 'accounts' : null }] };
    }
    if (text.includes('information_schema.tables')) {
      const asked = (params as [string[]])[0];
      return {
        rows: asked.filter((t) => existing.has(t)).map((t) => ({ table_name: t })),
      };
    }
    if (text.includes('ON CONFLICT (name) DO NOTHING')) {
      stamped.push((params as [string])[0]);
      return { rows: [] };
    }
    if (text.includes('SELECT name FROM schema_migrations')) {
      return { rows: stamped.map((name) => ({ name })) };
    }
    throw new Error(`Unexpected query in test: ${text}`);
  });

  return stamped;
}

/** Serves per-file SQL bodies through the fs.readFileSync mock. */
function routeMigrationSql(sqlByFile: Record<string, string>): void {
  (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
    const base = String(filePath).split('/').pop() as string;
    if (!(base in sqlByFile)) {
      throw new Error(`Unexpected readFileSync in test: ${filePath}`);
    }
    return sqlByFile[base];
  });
}

describe('Migration Runner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue(mockClient);
  });

  describe('ensureMigrationsTable', () => {
    it('should create schema_migrations table if not exists', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await ensureMigrationsTable(mockPool);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS schema_migrations');
    });
  });

  describe('getAppliedMigrations', () => {
    it('should return a set of applied migration names', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ name: '001_initial_schema.sql' }, { name: '002_add_index.sql' }],
      });
      const applied = await getAppliedMigrations(mockPool);
      expect(applied).toBeInstanceOf(Set);
      expect(applied.has('001_initial_schema.sql')).toBe(true);
      expect(applied.has('002_add_index.sql')).toBe(true);
      expect(applied.size).toBe(2);
    });

    it('should return empty set when no migrations applied', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const applied = await getAppliedMigrations(mockPool);
      expect(applied.size).toBe(0);
    });
  });

  describe('getPendingMigrations', () => {
    it('should return only unapplied SQL files sorted by name', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([
        '001_initial_schema.sql',
        '002_add_index.sql',
        '003_add_table.sql',
        'migrate.ts',
        'migrate.spec.ts',
      ]);
      // getAppliedMigrations call
      mockQuery.mockResolvedValue({
        rows: [{ name: '001_initial_schema.sql' }],
      });
      const pending = await getPendingMigrations(mockPool);
      expect(pending).toEqual(['002_add_index.sql', '003_add_table.sql']);
    });

    it('should return empty when all migrations applied', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue(['001_initial_schema.sql']);
      mockQuery.mockResolvedValue({
        rows: [{ name: '001_initial_schema.sql' }],
      });
      const pending = await getPendingMigrations(mockPool);
      expect(pending).toEqual([]);
    });

    it('should throw Error on schema drift when applied migration is missing from files', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue(['002_add_index.sql']);
      mockQuery.mockResolvedValue({
        rows: [{ name: '001_initial_schema.sql' }],
      });
      await expect(getPendingMigrations(mockPool)).rejects.toThrow('Schema drift detected: Applied migration 001_initial_schema.sql is missing from the filesystem.');
    });

    it('should throw Error on schema drift when pending migration is older than latest applied', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue(['001_initial_schema.sql', '002_add_index.sql']);
      mockQuery.mockResolvedValue({
        rows: [{ name: '002_add_index.sql' }],
      });
      await expect(getPendingMigrations(mockPool)).rejects.toThrow('Schema drift detected: Pending migration 001_initial_schema.sql is older than applied migration 002_add_index.sql.');
    });
  });

  describe('extractCreatedTables', () => {
    it('parses bare and IF NOT EXISTS CREATE TABLE statements', () => {
      const sql = `
        CREATE TABLE accounts (id UUID PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS attestations (
          id UUID PRIMARY KEY,
          contract_id UUID
        );
      `;
      expect(extractCreatedTables(sql)).toEqual(['accounts', 'attestations']);
    });

    it('lowercases unquoted names, strips schema qualification and quotes', () => {
      const sql = `
        CREATE TABLE Public.Contracts (id UUID);
        CREATE TABLE IF NOT EXISTS "public"."MixedCase" (id UUID);
      `;
      expect(extractCreatedTables(sql)).toEqual(['contracts', 'MixedCase']);
    });

    it('deduplicates repeated names and ignores non-table DDL', () => {
      const sql = `
        CREATE TYPE account_type AS ENUM ('ASSET');
        CREATE TABLE accounts (id UUID);
        CREATE TABLE IF NOT EXISTS accounts (id UUID);
        CREATE INDEX idx_accounts ON accounts(id);
        CREATE TEMP TABLE scratch (id INT);
        CREATE OR REPLACE FUNCTION f() RETURNS TRIGGER AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;
        CREATE TRIGGER t BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION f();
      `;
      expect(extractCreatedTables(sql)).toEqual(['accounts']);
    });

    it('returns empty for ALTER-only migrations', () => {
      const sql = `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
        CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked_until);
      `;
      expect(extractCreatedTables(sql)).toEqual([]);
    });
  });

  describe('allTablesExist', () => {
    it('is vacuously true for an empty list without querying', async () => {
      await expect(allTablesExist(mockPool, [])).resolves.toBe(true);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('returns true when information_schema reports every table', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ table_name: 'accounts' }, { table_name: 'users' }],
      });
      await expect(allTablesExist(mockPool, ['accounts', 'users'])).resolves.toBe(true);
      expect(mockQuery.mock.calls[0][0]).toContain('information_schema.tables');
      expect(mockQuery.mock.calls[0][1]).toEqual([['accounts', 'users']]);
    });

    it('returns false when any table is missing', async () => {
      mockQuery.mockResolvedValue({ rows: [{ table_name: 'accounts' }] });
      await expect(allTablesExist(mockPool, ['accounts', 'pod_broadcast_log'])).resolves.toBe(false);
    });
  });

  describe('baselineFromExistingSchema', () => {
    it('stamps only the contiguous prefix whose tables exist and stops at the first gap', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([
        '001_initial_schema.sql',
        '009_missing_base_tables.sql',
        '050_behavioral_omega_tables.sql',
      ]);
      routeMigrationSql({
        '001_initial_schema.sql': 'CREATE TABLE accounts (id UUID); CREATE TABLE users (id UUID);',
        '009_missing_base_tables.sql': 'CREATE TABLE IF NOT EXISTS attestations (id UUID);',
        '050_behavioral_omega_tables.sql': 'CREATE TABLE IF NOT EXISTS pod_broadcast_log (id UUID);',
      });
      const stamped = routeQueries({
        existingTables: ['accounts', 'users', 'attestations'],
        sentinelPresent: true,
      });

      await expect(baselineFromExistingSchema(mockPool)).resolves.toEqual([
        '001_initial_schema.sql',
        '009_missing_base_tables.sql',
      ]);
      expect(stamped).toEqual(['001_initial_schema.sql', '009_missing_base_tables.sql']);
      // Baseline stamps; it never executes DDL.
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('vacuously covers ALTER-only migrations inside the prefix', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([
        '001_initial_schema.sql',
        '007_user_compliance_identity_fields.sql',
        '050_behavioral_omega_tables.sql',
      ]);
      routeMigrationSql({
        '001_initial_schema.sql': 'CREATE TABLE accounts (id UUID);',
        '007_user_compliance_identity_fields.sql':
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_name TEXT;',
        '050_behavioral_omega_tables.sql': 'CREATE TABLE IF NOT EXISTS pod_broadcast_log (id UUID);',
      });
      const stamped = routeQueries({
        existingTables: ['accounts'],
        sentinelPresent: true,
      });

      await baselineFromExistingSchema(mockPool);
      expect(stamped).toEqual([
        '001_initial_schema.sql',
        '007_user_compliance_identity_fields.sql',
      ]);
    });

    it('never stamps past a gap, even when a later file\'s tables exist', async () => {
      // Stamping 050 while 009 stays pending would trip getPendingMigrations'
      // ordering invariant (pending 009 older than applied 050 → drift error).
      (fs.readdirSync as jest.Mock).mockReturnValue([
        '001_initial_schema.sql',
        '009_missing_base_tables.sql',
        '050_behavioral_omega_tables.sql',
      ]);
      routeMigrationSql({
        '001_initial_schema.sql': 'CREATE TABLE accounts (id UUID);',
        '009_missing_base_tables.sql': 'CREATE TABLE IF NOT EXISTS attestations (id UUID);',
        '050_behavioral_omega_tables.sql': 'CREATE TABLE IF NOT EXISTS pod_broadcast_log (id UUID);',
      });
      const stamped = routeQueries({
        existingTables: ['accounts', 'pod_broadcast_log'],
        sentinelPresent: true,
      });

      await expect(baselineFromExistingSchema(mockPool)).resolves.toEqual([
        '001_initial_schema.sql',
      ]);
      expect(stamped).toEqual(['001_initial_schema.sql']);
    });

    it('stamps nothing when the first migration\'s tables are absent', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue(['001_initial_schema.sql']);
      routeMigrationSql({
        '001_initial_schema.sql': 'CREATE TABLE accounts (id UUID);',
      });
      const stamped = routeQueries({ existingTables: [], sentinelPresent: true });

      await expect(baselineFromExistingSchema(mockPool)).resolves.toEqual([]);
      expect(stamped).toEqual([]);
    });
  });

  describe('runMigrations — fresh empty database', () => {
    it('executes EVERY migration in order within transactions (no baselining)', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // ensureMigrationsTable CREATE TABLE
        .mockResolvedValueOnce({ rows: [] }) // tracked getAppliedMigrations (empty)
        .mockResolvedValueOnce({ rows: [{ reg: null }] }) // isSchemaPreInitialized -> fresh DB
        .mockResolvedValueOnce({ rows: [] }); // getPendingMigrations -> getAppliedMigrations (empty)

      (fs.readdirSync as jest.Mock).mockReturnValue([
        '001_initial_schema.sql',
        '002_add_index.sql',
      ]);
      (fs.readFileSync as jest.Mock)
        .mockReturnValueOnce('CREATE TABLE accounts (...);')
        .mockReturnValueOnce('CREATE INDEX idx_foo ON bar(baz);');

      mockClient.query.mockResolvedValue({ rows: [] });

      const applied = await runMigrations(mockPool);
      expect(applied).toEqual(['001_initial_schema.sql', '002_add_index.sql']);

      // Each migration: BEGIN, SQL, INSERT, COMMIT = 4 calls per migration
      expect(mockClient.query).toHaveBeenCalledTimes(8);
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClient.query).toHaveBeenNthCalledWith(2, 'CREATE TABLE accounts (...);');
      expect(mockClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(2);
      // No baseline stamping happened on the pool.
      const stampCalls = mockQuery.mock.calls.filter(([text]) =>
        String(text).includes('ON CONFLICT (name) DO NOTHING'),
      );
      expect(stampCalls).toEqual([]);
    });

    it('should skip when no pending migrations', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // CREATE TABLE
        .mockResolvedValueOnce({ rows: [{ name: '001_initial_schema.sql' }] }) // tracked (non-empty -> no baseline)
        .mockResolvedValueOnce({ rows: [{ name: '001_initial_schema.sql' }] }); // getPendingMigrations -> getAppliedMigrations

      (fs.readdirSync as jest.Mock).mockReturnValue(['001_initial_schema.sql']);

      const applied = await runMigrations(mockPool);
      expect(applied).toEqual([]);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('should rollback on migration failure', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // CREATE TABLE
        .mockResolvedValueOnce({ rows: [] }) // tracked (empty)
        .mockResolvedValueOnce({ rows: [{ reg: null }] }) // isSchemaPreInitialized -> not initialized
        .mockResolvedValueOnce({ rows: [] }); // getPendingMigrations -> getAppliedMigrations (empty)

      (fs.readdirSync as jest.Mock).mockReturnValue(['001_bad.sql']);
      (fs.readFileSync as jest.Mock).mockReturnValue('INVALID SQL;');

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('syntax error')); // SQL fails

      await expect(runMigrations(mockPool)).rejects.toThrow('syntax error');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('isSchemaPreInitialized', () => {
    it('returns true when the sentinel table already exists', async () => {
      mockQuery.mockResolvedValue({ rows: [{ reg: 'accounts' }] });
      await expect(isSchemaPreInitialized(mockPool)).resolves.toBe(true);
      // Probes via to_regclass on the 'accounts' sentinel table.
      expect(mockQuery.mock.calls[0][0]).toContain('to_regclass');
      expect(mockQuery.mock.calls[0][1]).toEqual(['accounts']);
    });

    it('returns false when the sentinel table is absent', async () => {
      mockQuery.mockResolvedValue({ rows: [{ reg: null }] });
      await expect(isSchemaPreInitialized(mockPool)).resolves.toBe(false);
    });
  });

  describe('runMigrations drift guard — legacy schema.sql database', () => {
    it('baselines only the covered prefix and EXECUTES the migration-only remainder', async () => {
      // A DB provisioned by the legacy initdb-mounted schema.sql: the base
      // tables exist, schema_migrations is empty, and 050's tables were never
      // part of schema.sql. The old blanket baseline stamped 050 too, so its
      // tables could never come into existence. Now 001/009 are adopted and
      // 050 actually runs.
      (fs.readdirSync as jest.Mock).mockReturnValue([
        '001_initial_schema.sql',
        '009_missing_base_tables.sql',
        '050_behavioral_omega_tables.sql',
      ]);
      routeMigrationSql({
        '001_initial_schema.sql': 'CREATE TABLE accounts (id UUID); CREATE TABLE users (id UUID);',
        '009_missing_base_tables.sql': 'CREATE TABLE IF NOT EXISTS attestations (id UUID);',
        '050_behavioral_omega_tables.sql': 'CREATE TABLE IF NOT EXISTS pod_broadcast_log (id UUID);',
      });
      const stamped = routeQueries({
        existingTables: ['accounts', 'users', 'attestations'],
        sentinelPresent: true,
      });
      mockClient.query.mockResolvedValue({ rows: [] });

      const applied = await runMigrations(mockPool);

      expect(stamped).toEqual(['001_initial_schema.sql', '009_missing_base_tables.sql']);
      expect(applied).toEqual(['050_behavioral_omega_tables.sql']);
      expect(mockClient.query).toHaveBeenCalledWith(
        'CREATE TABLE IF NOT EXISTS pod_broadcast_log (id UUID);',
      );
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('executes everything when the sentinel exists but no migration tables match', async () => {
      // Degenerate pre-initialized state (sentinel present, schema otherwise
      // unrecognizable): nothing is baselined and the whole chain runs.
      (fs.readdirSync as jest.Mock).mockReturnValue([
        '001_initial_schema.sql',
        '009_missing_base_tables.sql',
      ]);
      routeMigrationSql({
        '001_initial_schema.sql': 'CREATE TABLE ledger_accounts (id UUID);',
        '009_missing_base_tables.sql': 'CREATE TABLE IF NOT EXISTS attestations (id UUID);',
      });
      const stamped = routeQueries({ existingTables: [], sentinelPresent: true });
      mockClient.query.mockResolvedValue({ rows: [] });

      const applied = await runMigrations(mockPool);

      expect(stamped).toEqual([]);
      expect(applied).toEqual(['001_initial_schema.sql', '009_missing_base_tables.sql']);
    });
  });

  describe('listMigrationFiles (real migrations directory)', () => {
    it('returns the on-disk .sql migrations in deterministic sorted order', () => {
      // Use the real fs for this assertion against the committed migrations.
      const realFs = jest.requireActual('fs') as typeof import('fs');
      (fs.readdirSync as jest.Mock).mockImplementation((...args: unknown[]) =>
        realFs.readdirSync(...(args as Parameters<typeof realFs.readdirSync>)),
      );

      const files = listMigrationFiles();
      expect(files.length).toBeGreaterThan(0);
      expect(files.every((f) => f.endsWith('.sql'))).toBe(true);
      // Sorted ascending and stable.
      expect([...files].sort()).toEqual(files);
      // The three tables called out in issue #28 are covered by migration 009.
      expect(files).toContain('009_missing_base_tables.sql');
    });

    it('every committed migration parses to a verifiable table set or is ALTER-only', () => {
      // Guards the baseline heuristic against future migrations that the
      // CREATE TABLE regex cannot see (e.g. dynamic SQL): each file must
      // yield only sane, lowercase table identifiers.
      const realFs = jest.requireActual('fs') as typeof import('fs');
      (fs.readdirSync as jest.Mock).mockImplementation((...args: unknown[]) =>
        realFs.readdirSync(...(args as Parameters<typeof realFs.readdirSync>)),
      );

      const path = jest.requireActual('path') as typeof import('path');
      for (const file of listMigrationFiles()) {
        const sql = realFs.readFileSync(path.join(__dirname, file), 'utf-8');
        for (const table of extractCreatedTables(String(sql))) {
          expect(table).toMatch(/^[a-z_][a-z0-9_$]*$/);
        }
      }
    });
  });
});
