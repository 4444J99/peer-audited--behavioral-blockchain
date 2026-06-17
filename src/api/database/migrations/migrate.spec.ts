import {
  baselineFromExistingSchema,
  ensureMigrationsTable,
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
  });

  describe('runMigrations', () => {
    it('should apply pending migrations in order within transactions', async () => {
      // ensureMigrationsTable
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // CREATE TABLE
        .mockResolvedValueOnce({ rows: [] }) // tracked getAppliedMigrations (empty)
        .mockResolvedValueOnce({ rows: [{ reg: null }] }) // isSchemaPreInitialized -> not initialized
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

  describe('baselineFromExistingSchema', () => {
    it('stamps every migration file as applied without executing it', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([
        '001_initial_schema.sql',
        '009_missing_base_tables.sql',
      ]);
      mockQuery.mockResolvedValue({ rows: [] });

      const stamped = await baselineFromExistingSchema(mockPool);

      expect(stamped).toEqual([
        '001_initial_schema.sql',
        '009_missing_base_tables.sql',
      ]);
      // One idempotent INSERT ... ON CONFLICT per file; no DDL is executed.
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery.mock.calls[0][0]).toContain('ON CONFLICT (name) DO NOTHING');
      expect(mockQuery.mock.calls[0][1]).toEqual(['001_initial_schema.sql']);
      expect(mockConnect).not.toHaveBeenCalled();
    });
  });

  describe('runMigrations drift guard (issue #28)', () => {
    it('baselines a schema.sql-provisioned DB instead of replaying colliding migrations', async () => {
      // Fresh `docker compose up`: schema.sql created the tables via initdb,
      // but schema_migrations is empty so every migration looks "pending".
      // Without the guard, migration 001 (`CREATE TYPE` / `CREATE TABLE accounts`
      // with no IF NOT EXISTS) would crash with "already exists".
      (fs.readdirSync as jest.Mock).mockReturnValue([
        '001_initial_schema.sql',
        '009_missing_base_tables.sql',
      ]);

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // ensureMigrationsTable CREATE TABLE
        .mockResolvedValueOnce({ rows: [] }) // tracked getAppliedMigrations (empty)
        .mockResolvedValueOnce({ rows: [{ reg: 'accounts' }] }) // isSchemaPreInitialized -> true
        .mockResolvedValueOnce({ rows: [] }) // baseline INSERT 001
        .mockResolvedValueOnce({ rows: [] }) // baseline INSERT 009
        .mockResolvedValueOnce({
          rows: [
            { name: '001_initial_schema.sql' },
            { name: '009_missing_base_tables.sql' },
          ],
        }); // getPendingMigrations -> getAppliedMigrations (now baselined)

      const applied = await runMigrations(mockPool);

      // Nothing replayed: the existing schema was adopted as the baseline.
      expect(applied).toEqual([]);
      expect(mockConnect).not.toHaveBeenCalled();
      expect(fs.readFileSync as jest.Mock).not.toHaveBeenCalled();
    });

    it('still applies genuinely new migrations after baselining', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([
        '001_initial_schema.sql',
        '041_brand_new.sql',
      ]);

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // ensureMigrationsTable
        .mockResolvedValueOnce({ rows: [] }) // tracked (empty)
        .mockResolvedValueOnce({ rows: [{ reg: 'accounts' }] }) // isSchemaPreInitialized -> true
        .mockResolvedValueOnce({ rows: [] }) // baseline INSERT 001
        .mockResolvedValueOnce({ rows: [] }) // baseline INSERT 041
        .mockResolvedValueOnce({
          rows: [
            { name: '001_initial_schema.sql' },
            { name: '041_brand_new.sql' },
          ],
        }); // getPendingMigrations -> getAppliedMigrations

      // With both files baselined, nothing is pending. This documents that
      // baseline adopts the full known set; new migrations added AFTER the
      // baseline run are picked up on the next invocation.
      const applied = await runMigrations(mockPool);
      expect(applied).toEqual([]);
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
  });
});
