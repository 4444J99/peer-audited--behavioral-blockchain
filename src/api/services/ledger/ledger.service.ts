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
   * Phantom Money Test: verifies the structural integrity of the double-entry
   * ledger. Returns balanced=false when a corrupted or phantom entry is detected.
   *
   * In this schema each row in `entries` carries a SINGLE `amount` together with a
   * `debit_account_id` and a `credit_account_id`, so every row is inherently
   * balanced (the same amount debits one account and credits another). A naive
   * "global sum of debits === global sum of credits" check is therefore
   * tautologically true and detects nothing. Instead we assert the invariants
   * that CAN actually be violated by corruption, a buggy migration, or a manual
   * write that bypasses recordTransaction():
   *
   *   1. Positive-amount invariant: no entry may have amount <= 0. A zero or
   *      negative amount means money was minted/destroyed on a posting.
   *   2. Distinct-leg invariant: no entry may debit and credit the SAME account
   *      (debit_account_id = credit_account_id) — such a row is a no-op that
   *      masks a real, lost posting.
   *   3. Referential invariant: every debit_account_id and credit_account_id must
   *      reference an existing row in `accounts`. An orphaned reference means an
   *      entry points at money that lives in no real account (phantom money).
   *
   * Any violation flips balanced=false. The returned totalDebits / totalCredits
   * remain the aggregate SUMs over `entries` (one for the debit side, one for the
   * credit side) and are kept purely for reporting / audit-trail context.
   */
  async verifyLedgerIntegrity(client?: PoolClient | Pool): Promise<{ balanced: boolean; totalDebits: number; totalCredits: number }> {
    const db = client || this.pool;

    // Reporting totals only. By construction these are equal (each row contributes
    // its amount to both the debit and credit side), so they are NOT used to decide
    // `balanced`; they exist for the audit trail / error messages.
    const conservation = await db.query(
      `SELECT
        COALESCE(SUM(amount), 0) AS total_debits,
        COALESCE(SUM(amount), 0) AS total_credits
      FROM entries`,
    );
    const totalDebits = Number.parseInt(String(conservation.rows[0].total_debits), 10);
    const totalCredits = Number.parseInt(String(conservation.rows[0].total_credits), 10);

    // Real, falsifiable structural invariants. A single query counts every kind of
    // violation; a healthy ledger returns all zeros.
    const integrity = await db.query(
      `SELECT
        COUNT(*) FILTER (WHERE e.amount <= 0) AS non_positive_count,
        COUNT(*) FILTER (WHERE e.debit_account_id = e.credit_account_id) AS self_entry_count,
        COUNT(*) FILTER (WHERE da.id IS NULL OR ca.id IS NULL) AS orphaned_count
      FROM entries e
      LEFT JOIN accounts da ON da.id = e.debit_account_id
      LEFT JOIN accounts ca ON ca.id = e.credit_account_id`,
    );

    const row = integrity.rows[0] || {};
    const nonPositiveCount = Number.parseInt(String(row.non_positive_count ?? 0), 10);
    const selfEntryCount = Number.parseInt(String(row.self_entry_count ?? 0), 10);
    const orphanedCount = Number.parseInt(String(row.orphaned_count ?? 0), 10);

    const balanced = nonPositiveCount === 0 && selfEntryCount === 0 && orphanedCount === 0;

    return {
      balanced,
      totalDebits,
      totalCredits,
    };
  }
}
