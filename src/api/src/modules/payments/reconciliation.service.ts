import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { LedgerService } from '../../../services/ledger/ledger.service';

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
    const expectedAmountCents = Math.round(Number(contract.rows[0].stake_amount) * 100);

    // 2. Get the successful settlement run
    const runs = await this.pool.query(
      "SELECT * FROM settlement_runs WHERE contract_id = $1 AND status = 'SUCCESS'",
      [contractId]
    );
    const run = runs.rows[0];
    if (!run) {
      discrepancies.push('No successful settlement run found');
    }

    // 3. Aggregate Ledger Entries
    const ledgerEntries = await this.ledger.getContractLedger(contractId);
    
    // Calculate total money moved from Escrow
    const escrowWithdrawals = ledgerEntries
      .filter(e => e.metadata?.type?.includes('SETTLEMENT_RELEASE') || e.metadata?.type?.includes('SETTLEMENT_CAPTURE'))
      .reduce((sum, e) => sum + e.amount, 0);

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
