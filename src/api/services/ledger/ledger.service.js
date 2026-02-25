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
exports.LedgerService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let LedgerService = class LedgerService {
    constructor(pool) {
        this.pool = pool;
    }
    async recordTransaction(debitAccountId, creditAccountId, amount, contractId, metadata) {
        if (amount <= 0) {
            throw new Error('Transaction amount must be strictly positive.');
        }
        if (debitAccountId === creditAccountId) {
            throw new Error('Debit and credit accounts must be different.');
        }
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const insertEntryQuery = `
        INSERT INTO entries (debit_account_id, credit_account_id, amount, contract_id, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
            const entryResult = await client.query(insertEntryQuery, [
                debitAccountId,
                creditAccountId,
                amount,
                contractId || null,
                metadata || null,
            ]);
            const entryId = entryResult.rows[0].id;
            await client.query('COMMIT');
            return entryId;
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    async getAccountBalance(accountId) {
        const result = await this.pool.query(`SELECT
        COALESCE(SUM(CASE WHEN debit_account_id = $1 THEN amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN credit_account_id = $1 THEN amount ELSE 0 END), 0)
        AS balance
      FROM entries
      WHERE debit_account_id = $1 OR credit_account_id = $1`, [accountId]);
        return parseFloat(result.rows[0].balance);
    }
    async getContractLedger(contractId) {
        const result = await this.pool.query(`SELECT id, debit_account_id, credit_account_id, amount, metadata, created_at
       FROM entries
       WHERE contract_id = $1
       ORDER BY created_at ASC`, [contractId]);
        return result.rows.map((row) => ({
            id: row.id,
            debitAccountId: row.debit_account_id,
            creditAccountId: row.credit_account_id,
            amount: parseFloat(row.amount),
            metadata: row.metadata,
            createdAt: row.created_at,
        }));
    }
    async verifyLedgerIntegrity() {
        const result = await this.pool.query(`SELECT
        COALESCE(SUM(amount), 0) AS total
      FROM entries`);
        const detailResult = await this.pool.query(`SELECT
        debit_account_id,
        credit_account_id,
        SUM(amount) as total
      FROM entries
      GROUP BY debit_account_id, credit_account_id`);
        const accountBalances = new Map();
        for (const row of detailResult.rows) {
            const amount = parseFloat(row.total);
            const debitId = row.debit_account_id;
            const creditId = row.credit_account_id;
            accountBalances.set(debitId, (accountBalances.get(debitId) || 0) + amount);
            accountBalances.set(creditId, (accountBalances.get(creditId) || 0) - amount);
        }
        let netBalance = 0;
        for (const balance of accountBalances.values()) {
            netBalance += balance;
        }
        const totalAmount = parseFloat(result.rows[0].total);
        return {
            balanced: Math.abs(netBalance) < 0.0001,
            totalDebits: totalAmount,
            totalCredits: totalAmount,
        };
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pg_1.Pool])
], LedgerService);
//# sourceMappingURL=ledger.service.js.map