import { ensureMigrationsTable, getAppliedMigrations, getPendingMigrations, runMigrations } from './migrate';

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
        .mockResolvedValueOnce({ rows: [] }); // getAppliedMigrations (empty)

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
        .mockResolvedValueOnce({ rows: [{ name: '001_initial_schema.sql' }] });

      (fs.readdirSync as jest.Mock).mockReturnValue(['001_initial_schema.sql']);

      const applied = await runMigrations(mockPool);
      expect(applied).toEqual([]);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('should rollback on migration failure', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

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
});
