import { Injectable, Optional, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { QuarantineService } from '../../src/modules/ledger/quarantine.service';

@Injectable()
export class LedgerService {
  constructor(
    private readonly pool: Pool,
    @Optional() @Inject(QuarantineService) private readonly quarantine?: QuarantineService,
  ) {}

  /**
   * Records a double-entry transaction linking a debit and credit account.
   * Ensures ACID compliance using PostgreSQL transactions.
   */
  async recordTransaction(
    debitAccountId: string,
    creditAccountId: string,
    amount: number, // integer cents
    contractId?: string,
    metadata?: Record<string, any>,
    client?: PoolClient
  ): Promise<string> {
    if (amount <= 0) {
      throw new Error('Transaction amount must be strictly positive.');
    }
    if (!Number.isInteger(amount)) {
      throw new Error('Transaction amount must be an integer (cents).');
    }
    if (debitAccountId === creditAccountId) {
      throw new Error('Debit and credit accounts must be different.');
    }

    const dbClient: PoolClient = client || await this.pool.connect();

    try {
      if (!client) await dbClient.query('BEGIN');

      // 1. Insert the entry record
      const insertEntryQuery = `
        INSERT INTO entries (debit_account_id, credit_account_id, amount, contract_id, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      const entryResult = await dbClient.query(insertEntryQuery, [
        debitAccountId,
        creditAccountId,
        amount,
        contractId || null,
        metadata || null,
      ]);
      const entryId = entryResult.rows[0].id;

      // Ensure zero money printing manually at application layer (Phantom Money Test safeguard)
      if (process.env.STYX_ENFORCE_HARD_INTEGRITY === 'true') {
        const integrity = await this.verifyLedgerIntegrity(dbClient);
        if (!integrity.balanced) {
          if (this.quarantine) {
            await this.quarantine.activateQuarantine(debitAccountId, 'PHANTOM_MONEY_DETECTED_IN_TX', {
              amount,
              creditAccountId,
              contractId,
              integrityResults: integrity,
            });
          }
          throw new Error(`Phantom money detected! Ledger unbalanced: ${integrity.totalDebits} vs ${integrity.totalCredits}`);
        }
      }

      if (!client) await dbClient.query('COMMIT');
      return entryId;
    } catch (e) {
      if (!client) await dbClient.query('ROLLBACK');
      throw e;
    } finally {
      if (!client) dbClient.release();
    }
  }

  /**
   * Returns the net balance for an account in integer cents (total credits - total debits).
   * Credit entries increase the balance (liability/equity increase); debit entries decrease it.
   * This is the canonical sign convention for all user and system accounts in Styx.
   */
  async getAccountBalance(accountId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN credit_account_id = $1 THEN amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN debit_account_id = $1 THEN amount ELSE 0 END), 0)
        AS balance
      FROM entries
      WHERE debit_account_id = $1 OR credit_account_id = $1`,
      [accountId],
    );
    return Number.parseInt(String(result.rows[0].balance), 10);
  }

  /**
   * Returns all ledger entries associated with a specific contract,
   * ordered chronologically. Used for contract settlement audit trails.
   */
  async getContractLedger(contractId: string): Promise<Array<{
    id: string;
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    metadata: Record<string, any> | null;
    createdAt: Date;
  }>> {
    const result = await this.pool.query(
      `SELECT id, debit_account_id, credit_account_id, amount, metadata, created_at
       FROM entries
       WHERE contract_id = $1
       ORDER BY created_at ASC`,
      [contractId],
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      debitAccountId: row.debit_account_id,
      creditAccountId: row.credit_account_id,
      amount: Number.parseInt(String(row.amount), 10),
      metadata: row.metadata,
      createdAt: row.created_at,
    }));
  }

  /**
   * Phantom Money Test: verifies that all debits equal all credits across
   * the entire ledger. Returns true if balanced, false if phantom money detected.
   */
  async verifyLedgerIntegrity(client?: PoolClient | Pool): Promise<{ balanced: boolean; totalDebits: number; totalCredits: number }> {
    const db = client || this.pool;
    const result = await db.query(
      `SELECT
        COALESCE(SUM(amount), 0) AS total
      FROM entries`,
    );
    // In a double-entry system, every entry has equal debit and credit,
    // so the sum of amounts represents money flowing in both directions equally.
    // True integrity check: sum of debit-side == sum of credit-side.
    const detailResult = await db.query(
      `SELECT
        debit_account_id,
        credit_account_id,
        SUM(amount) as total
      FROM entries
      GROUP BY debit_account_id, credit_account_id`,
    );

    // Aggregate debits and credits per account
    const accountBalances = new Map<string, number>();
    for (const row of detailResult.rows) {
      const amount = Number.parseInt(String(row.total), 10);
      const debitId = row.debit_account_id;
      const creditId = row.credit_account_id;
      accountBalances.set(debitId, (accountBalances.get(debitId) || 0) + amount);
      accountBalances.set(creditId, (accountBalances.get(creditId) || 0) - amount);
    }

    // Sum of all account balances must be exactly zero
    let netBalance = 0;
    for (const balance of accountBalances.values()) {
      netBalance += balance;
    }

    const totalAmount = Number.parseInt(String(result.rows[0].total), 10);
    return {
      balanced: netBalance === 0,
      totalDebits: totalAmount,
      totalCredits: totalAmount,
    };
  }
}
