import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { toCents } from '../../../../shared/libs/money';

/**
 * ReconciliationService
 * 
 * Ensures that the Real-Money Rails (Stripe) are in sync with the 
 * Double-Entry Ledger and the settlement_runs log.
 */

export interface ReconciliationSummary {
  contractId: string;
  isBalanced: boolean;
  expectedAmountCents: number;
  ledgerTotalCents: number;
  runStatus: string;
  discrepancies: string[];
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly pool: Pool,
    private readonly ledger: LedgerService,
  ) {}

  /**
   * Performs a deep audit of a contract's financial lifecycle.
   */
  async reconcileContract(contractId: string): Promise<ReconciliationSummary> {
    const discrepancies: string[] = [];

    // 1. Get the contract definition
    const contract = await this.pool.query(
      "SELECT stake_amount, status FROM contracts WHERE id = $1",
      [contractId]
    );
    if (contract.rows.length === 0) {
      throw new Error(`Contract ${contractId} not found`);
    }
    const expectedAmountCents = toCents(Number(contract.rows[0].stake_amount));

    // 2. Get the most recent successful settlement run (deterministic ordering).
    const runs = await this.pool.query(
      "SELECT * FROM settlement_runs WHERE contract_id = $1 AND status = 'SUCCESS' ORDER BY completed_at DESC NULLS LAST, started_at DESC",
      [contractId]
    );
    const run = runs.rows[0];
    if (!run) {
      discrepancies.push('No successful settlement run found');
    }

    // 3. Aggregate Ledger Entries
    const ledgerEntries = await this.ledger.getContractLedger(contractId);

    // Identify the escrow account so we can validate transfer DIRECTION, not just magnitude.
    // A settlement withdrawal must DEBIT the escrow account. Counting by magnitude alone let a
    // wrong-direction entry of equal value silently balance the books.
    const escrowAccount = await this.pool.query(
      "SELECT id FROM accounts WHERE name = 'SYSTEM_ESCROW' LIMIT 1"
    );
    const escrowAccountId = escrowAccount.rows[0]?.id;

    // Calculate total money moved OUT of Escrow (debit side of escrow only).
    const settlementEntries = ledgerEntries
      .filter(e => e.metadata?.type?.includes('SETTLEMENT_RELEASE') || e.metadata?.type?.includes('SETTLEMENT_CAPTURE'));

    const escrowWithdrawals = settlementEntries
      .filter(e => e.debitAccountId === escrowAccountId)
      .reduce((sum, e) => sum + e.amount, 0);

    // Flag any settlement entry that does not debit escrow (wrong direction / wrong account).
    const wrongDirection = settlementEntries.filter(e => e.debitAccountId !== escrowAccountId);
    if (wrongDirection.length > 0) {
      discrepancies.push(
        `Wrong-direction settlement entries: ${wrongDirection.length} entry(ies) do not debit the escrow account`
      );
    }

    if (escrowWithdrawals !== expectedAmountCents) {
      discrepancies.push(`Ledger imbalance: Expected ${expectedAmountCents} withdrew ${escrowWithdrawals}`);
    }

    return {
      contractId,
      isBalanced: discrepancies.length === 0,
      expectedAmountCents,
      ledgerTotalCents: escrowWithdrawals,
      runStatus: run?.status || 'NOT_FOUND',
      discrepancies,
    };
  }

  /**
   * Generates a "Custody Review" report for all settlements in a period.
   */
  async generateCustodyReport(startDate: Date, endDate: Date) {
    const query = `
      SELECT 
        sr.contract_id,
        sr.amount_cents,
        sr.outcome,
        sr.disposition_mode,
        sr.provider_tx_id,
        c.user_id,
        u.email
      FROM settlement_runs sr
      JOIN contracts c ON sr.contract_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE sr.completed_at BETWEEN $1 AND $2
      AND sr.status = 'SUCCESS'
    `;
    const result = await this.pool.query(query, [startDate, endDate]);
    return result.rows;
  }
}
