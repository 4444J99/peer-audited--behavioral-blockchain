"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TruthLogService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const crypto_1 = require("crypto");
let TruthLogService = class TruthLogService {
    constructor(pool) {
        this.pool = pool;
    }
    async verifyChain() {
        const result = await this.pool.query('SELECT id, event_type, payload, previous_hash, current_hash FROM event_log ORDER BY created_at ASC');
        const corrupted = [];
        let expectedPreviousHash = 'GENESIS_HASH';
        for (const row of result.rows) {
            if (row.previous_hash !== expectedPreviousHash) {
                corrupted.push(row.id);
            }
            const hashInput = `${row.previous_hash}${JSON.stringify(row.payload)}`;
            const recomputedHash = (0, crypto_1.createHash)('sha256').update(hashInput).digest('hex');
            if (recomputedHash !== row.current_hash) {
                if (!corrupted.includes(row.id)) {
                    corrupted.push(row.id);
                }
            }
            expectedPreviousHash = row.current_hash;
        }
        return {
            valid: corrupted.length === 0,
            checked: result.rows.length,
            corrupted,
        };
    }
    async appendEvent(eventType, payload) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const latestLogQuery = `
        SELECT current_hash 
        FROM event_log 
        ORDER BY created_at DESC 
        LIMIT 1 
        FOR UPDATE;
      `;
            const latestRes = await client.query(latestLogQuery);
            const previousHash = latestRes.rows.length > 0 ? latestRes.rows[0].current_hash : 'GENESIS_HASH';
            const payloadString = JSON.stringify(payload);
            const hashInput = `${previousHash}${payloadString}`;
            const currentHash = (0, crypto_1.createHash)('sha256').update(hashInput).digest('hex');
            const insertQuery = `
        INSERT INTO event_log (event_type, payload, previous_hash, current_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
      `;
            const insertRes = await client.query(insertQuery, [
                eventType,
                payload,
                previousHash,
                currentHash
            ]);
            await client.query('COMMIT');
            return insertRes.rows[0].id;
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
};
exports.TruthLogService = TruthLogService;
exports.TruthLogService = TruthLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pg_1.Pool])
], TruthLogService);
//# sourceMappingURL=truth-log.service.js.map