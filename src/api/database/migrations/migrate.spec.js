"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const migrate_1 = require("./migrate");
jest.mock('fs', () => ({
    readdirSync: jest.fn(),
    readFileSync: jest.fn(),
}));
const fs = __importStar(require("fs"));
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
};
const mockPool = {
    query: mockQuery,
    connect: mockConnect,
};
describe('Migration Runner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConnect.mockResolvedValue(mockClient);
    });
    describe('ensureMigrationsTable', () => {
        it('should create schema_migrations table if not exists', async () => {
            mockQuery.mockResolvedValue({ rows: [] });
            await (0, migrate_1.ensureMigrationsTable)(mockPool);
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockQuery.mock.calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS schema_migrations');
        });
    });
    describe('getAppliedMigrations', () => {
        it('should return a set of applied migration names', async () => {
            mockQuery.mockResolvedValue({
                rows: [{ name: '001_initial_schema.sql' }, { name: '002_add_index.sql' }],
            });
            const applied = await (0, migrate_1.getAppliedMigrations)(mockPool);
            expect(applied).toBeInstanceOf(Set);
            expect(applied.has('001_initial_schema.sql')).toBe(true);
            expect(applied.has('002_add_index.sql')).toBe(true);
            expect(applied.size).toBe(2);
        });
        it('should return empty set when no migrations applied', async () => {
            mockQuery.mockResolvedValue({ rows: [] });
            const applied = await (0, migrate_1.getAppliedMigrations)(mockPool);
            expect(applied.size).toBe(0);
        });
    });
    describe('getPendingMigrations', () => {
        it('should return only unapplied SQL files sorted by name', async () => {
            fs.readdirSync.mockReturnValue([
                '001_initial_schema.sql',
                '002_add_index.sql',
                '003_add_table.sql',
                'migrate.ts',
                'migrate.spec.ts',
            ]);
            mockQuery.mockResolvedValue({
                rows: [{ name: '001_initial_schema.sql' }],
            });
            const pending = await (0, migrate_1.getPendingMigrations)(mockPool);
            expect(pending).toEqual(['002_add_index.sql', '003_add_table.sql']);
        });
        it('should return empty when all migrations applied', async () => {
            fs.readdirSync.mockReturnValue(['001_initial_schema.sql']);
            mockQuery.mockResolvedValue({
                rows: [{ name: '001_initial_schema.sql' }],
            });
            const pending = await (0, migrate_1.getPendingMigrations)(mockPool);
            expect(pending).toEqual([]);
        });
    });
    describe('runMigrations', () => {
        it('should apply pending migrations in order within transactions', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] });
            fs.readdirSync.mockReturnValue([
                '001_initial_schema.sql',
                '002_add_index.sql',
            ]);
            fs.readFileSync
                .mockReturnValueOnce('CREATE TABLE accounts (...);')
                .mockReturnValueOnce('CREATE INDEX idx_foo ON bar(baz);');
            mockClient.query.mockResolvedValue({ rows: [] });
            const applied = await (0, migrate_1.runMigrations)(mockPool);
            expect(applied).toEqual(['001_initial_schema.sql', '002_add_index.sql']);
            expect(mockClient.query).toHaveBeenCalledTimes(8);
            expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
            expect(mockClient.query).toHaveBeenNthCalledWith(2, 'CREATE TABLE accounts (...);');
            expect(mockClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');
            expect(mockClient.release).toHaveBeenCalledTimes(2);
        });
        it('should skip when no pending migrations', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ name: '001_initial_schema.sql' }] });
            fs.readdirSync.mockReturnValue(['001_initial_schema.sql']);
            const applied = await (0, migrate_1.runMigrations)(mockPool);
            expect(applied).toEqual([]);
            expect(mockConnect).not.toHaveBeenCalled();
        });
        it('should rollback on migration failure', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] });
            fs.readdirSync.mockReturnValue(['001_bad.sql']);
            fs.readFileSync.mockReturnValue('INVALID SQL;');
            mockClient.query
                .mockResolvedValueOnce({})
                .mockRejectedValueOnce(new Error('syntax error'));
            await expect((0, migrate_1.runMigrations)(mockPool)).rejects.toThrow('syntax error');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=migrate.spec.js.map