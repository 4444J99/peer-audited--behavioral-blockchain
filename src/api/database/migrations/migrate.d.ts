import { Pool } from 'pg';
export declare function ensureMigrationsTable(pool: Pool): Promise<void>;
export declare function getAppliedMigrations(pool: Pool): Promise<Set<string>>;
export declare function getPendingMigrations(pool: Pool): Promise<string[]>;
export declare function runMigrations(pool: Pool): Promise<string[]>;
