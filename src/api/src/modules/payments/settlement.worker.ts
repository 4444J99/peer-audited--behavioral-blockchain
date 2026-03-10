import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { Pool } from 'pg';
import { SETTLEMENT_QUEUE_NAME, REDIS_CONNECTION_CONFIG } from '../../../config/queue.config';
import { StripePayoutProvider } from './stripe-payout.provider';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PayoutStatus } from '../../common/interfaces/payout-provider.interface';
import { buildSettlementQuote } from './settlement-quote';

@Injectable()
export class SettlementWorker implements OnModuleInit {
  private readonly logger = new Logger(SettlementWorker.name);
  private worker!: Worker;

  constructor(
    private readonly pool: Pool,
    private readonly stripeProvider: StripePayoutProvider,
    private readonly ledger: LedgerService,
    private readonly truthLog: TruthLogService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      SETTLEMENT_QUEUE_NAME,
      async (job: Job) => this.process(job),
      { connection: REDIS_CONNECTION_CONFIG, concurrency: 2 },
    );
    this.logger.log('Settlement worker initialized and listening on SETTLEMENT_QUEUE');
  }

  private async process(job: Job): Promise<void> {
    const { contractId, outcome, paymentIntentId, amountCents, furies, dispositionMode } = job.data;
    this.logger.log(`Processing settlement for contract ${contractId} (${outcome})...`);

    const existing = await this.pool.query(
      `SELECT id FROM settlement_runs WHERE contract_id = $1 AND status = 'SUCCESS' AND outcome = $2`,
      [contractId, outcome]
    );
    if (existing.rows.length > 0) {
      this.logger.log(`Settlement for contract ${contractId} already succeeded. Skipping.`);
      return;
    }

    // TKT-P0-001: Deterministic Payout Breakdown
    const quote = buildSettlementQuote(amountCents, outcome, dispositionMode);

    const runResult = await this.pool.query(
      `INSERT INTO settlement_runs (contract_id, outcome, amount_cents, status, started_at, disposition_mode, quote_json)
       VALUES ($1, $2, $3, 'PROCESSING', NOW(), $4, $5)
       RETURNING id`,
      [contractId, outcome, amountCents, dispositionMode || (outcome === 'PASS' ? 'REFUND' : 'CAPTURE'), JSON.stringify(quote)]
    );
    const runId = runResult.rows[0].id;

    try {
      let result;
      const actualAction = quote.actualAction;

      if (actualAction === 'RELEASE') {
        result = await this.stripeProvider.releaseFunds(paymentIntentId, amountCents);
      } else {
        result = await this.stripeProvider.captureFunds(paymentIntentId, amountCents, { furies, runId });
      }

      if (result.status === PayoutStatus.SUCCESS) {
        await this.finalizeLedger(contractId, outcome, amountCents, runId, dispositionMode, quote);
        
        await this.pool.query(
          `UPDATE settlement_runs SET status = 'SUCCESS', provider_tx_id = $1, completed_at = NOW() WHERE id = $2`,
          [result.providerTransactionId, runId]
        );

        await this.truthLog.appendEvent('SETTLEMENT_COMPLETED', {
          contractId,
          outcome,
          runId,
          dispositionMode,
          actualAction,
          providerTransactionId: result.providerTransactionId,
          quote,
        });
        this.logger.log(`Settlement successful for contract ${contractId} (Action: ${actualAction})`);
      } else {
        throw new Error(result.error || 'Provider returned failure status without error message');
      }
    } catch (err: any) {
      await this.pool.query(
        `UPDATE settlement_runs SET status = 'FAILED', last_error = $1 WHERE id = $2`,
        [err.message, runId]
      );
      this.logger.error(`Settlement failed for ${contractId}: ${err.message}`);
      throw err;
    }
  }

  private async finalizeLedger(
    contractId: string, 
    outcome: string, 
    amountCents: number, 
    runId: string,
    dispositionMode?: string,
    quote?: any
  ) {
    const contractResult = await this.pool.query(
      `SELECT c.user_id, u.account_id, a_escrow.id as escrow_account_id, a_revenue.id as revenue_account_id, a_bounty.id as bounty_pool_account_id
       FROM contracts c
       JOIN users u ON c.user_id = u.id
       CROSS JOIN accounts a_escrow WHERE a_escrow.name = 'SYSTEM_ESCROW'
       CROSS JOIN accounts a_revenue WHERE a_revenue.name = 'SYSTEM_REVENUE'
       CROSS JOIN accounts a_bounty WHERE a_bounty.name = 'FURY_BOUNTY_POOL'
       WHERE c.id = $1`,
      [contractId]
    );

    if (contractResult.rows.length === 0) {
      throw new Error(`Contract ${contractId} or system accounts not found for ledger finalization`);
    }
    const row = contractResult.rows[0];

    const shouldReturnToUser = quote?.actualAction === 'RELEASE'
      || outcome === 'PASS'
      || dispositionMode === 'REFUND';

    const metadata = {
      settlement_run_id: runId,
      provider: 'stripe',
      outcome,
      dispositionMode
    };

    if (shouldReturnToUser) {
      const txType = 'REAL_MONEY_SETTLEMENT_RELEASE';
      const existing = await this.pool.query(
        "SELECT id FROM entries WHERE metadata->>'settlement_run_id' = $1 AND metadata->>'type' = $2",
        [runId, txType]
      );
      if (existing.rows.length === 0) {
        await this.ledger.recordTransaction(
          row.escrow_account_id,
          row.account_id,
          amountCents,
          contractId,
          { ...metadata, type: txType, reason: outcome === 'FAILED' ? 'REFUND_ONLY_JURISDICTION' : 'CONTRACT_SUCCESS' }
        );
      }
    } else {
      // Capture to Revenue
      const captureType = 'REAL_MONEY_SETTLEMENT_CAPTURE';
      const existingCapture = await this.pool.query(
        "SELECT id FROM entries WHERE metadata->>'settlement_run_id' = $1 AND metadata->>'type' = $2",
        [runId, captureType]
      );
      if (existingCapture.rows.length === 0) {
        await this.ledger.recordTransaction(
          row.escrow_account_id,
          row.revenue_account_id,
          amountCents,
          contractId,
          { ...metadata, type: captureType }
        );
      }

      // Move portion to Bounty Pool
      if (quote?.bountyPoolCents > 0) {
        const topupType = 'BOUNTY_POOL_TOPUP';
        const existingTopup = await this.pool.query(
          "SELECT id FROM entries WHERE metadata->>'settlement_run_id' = $1 AND metadata->>'type' = $2",
          [runId, topupType]
        );
        if (existingTopup.rows.length === 0) {
          await this.ledger.recordTransaction(
            row.revenue_account_id,
            row.bounty_pool_account_id,
            quote.bountyPoolCents,
            contractId,
            { ...metadata, type: topupType }
          );
        }
      }
    }
  }
}
