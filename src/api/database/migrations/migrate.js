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
exports.ensureMigrationsTable = ensureMigrationsTable;
exports.getAppliedMigrations = getAppliedMigrations;
exports.getPendingMigrations = getPendingMigrations;
exports.runMigrations = runMigrations;
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const MIGRATIONS_TABLE = 'schema_migrations';
const MIGRATIONS_DIR = path.join(__dirname);
async function ensureMigrationsTable(pool) {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
async function getAppliedMigrations(pool) {
    const result = await pool.query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id`);
    return new Set(result.rows.map((r) => r.name));
}
async function getPendingMigrations(pool) {
    const applied = await getAppliedMigrations(pool);
    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();
    return files.filter((f) => !applied.has(f));
}
async function runMigrations(pool) {
    await ensureMigrationsTable(pool);
    const pending = await getPendingMigrations(pool);
    if (pending.length === 0) {
        console.log('No pending migrations.');
        return [];
    }
    const applied = [];
    for (const file of pending) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`, [file]);
            await client.query('COMMIT');
            console.log(`Applied: ${file}`);
            applied.push(file);
        }
        catch (err) {
            await client.query('ROLLBACK');
            console.error(`Failed to apply ${file}:`, err);
            throw err;
        }
        finally {
            client.release();
        }
    }
    return applied;
}
if (require.main === module) {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://styx:styx@localhost:5432/styx';
    const pool = new pg_1.Pool({ connectionString: databaseUrl });
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
//# sourceMappingURL=migrate.js.map