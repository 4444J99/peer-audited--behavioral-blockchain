import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { Pool } from 'pg';
import { SETTLEMENT_QUEUE_NAME, REDIS_CONNECTION_CONFIG } from '../../../config/queue.config';
import { StripePayoutProvider } from './stripe-payout.provider';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PayoutStatus } from '../../common/interfaces/payout-provider.interface';

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
    const { contractId, outcome, paymentIntentId, amountCents, furies } = job.data;
    this.logger.log(`Processing settlement for contract ${contractId} (${outcome})...`);

    // Check if settlement was already completed (Idempotency)
    const existing = await this.pool.query(
      `SELECT id FROM settlement_runs WHERE contract_id = $1 AND outcome = $2 AND status = 'SUCCESS'`,
      [contractId, outcome]
    );
    if (existing.rows.length > 0) {
      this.logger.log(`Settlement for contract ${contractId} already succeeded. Skipping.`);
      return;
    }

    // Start a new settlement run record
    const runResult = await this.pool.query(
      `INSERT INTO settlement_runs (contract_id, outcome, amount_cents, status, started_at)
       VALUES ($1, $2, $3, 'PROCESSING', NOW())
       RETURNING id`,
      [contractId, outcome, amountCents]
    );
    const runId = runResult.rows[0].id;

    try {
      let result;
      if (outcome === 'PASS') {
        result = await this.stripeProvider.releaseFunds(paymentIntentId, amountCents);
      } else {
        result = await this.stripeProvider.captureFunds(paymentIntentId, amountCents, { furies });
      }

      if (result.status === PayoutStatus.SUCCESS) {
        // Atomic ledger finalization
        await this.finalizeLedger(contractId, outcome, amountCents);
        
        // Update run record
        await this.pool.query(
          `UPDATE settlement_runs SET status = 'SUCCESS', provider_tx_id = $1, completed_at = NOW() WHERE id = $2`,
          [result.providerTransactionId, runId]
        );

        await this.truthLog.appendEvent('SETTLEMENT_COMPLETED', {
          contractId,
          outcome,
          runId,
          providerTransactionId: result.providerTransactionId,
        });
        this.logger.log(`Settlement successful for contract ${contractId}`);
      } else {
        throw new Error(result.error || 'Provider returned failure status without error message');
      }
    } catch (err: any) {
      await this.pool.query(
        `UPDATE settlement_runs SET status = 'FAILED', last_error = $1 WHERE id = $2`,
        [err.message, runId]
      );
      this.logger.error(`Settlement failed for ${contractId}: ${err.message}`);
      throw err; // Re-throw for BullMQ retry
    }
  }

  private async finalizeLedger(contractId: string, outcome: string, amountCents: number) {
    const contractResult = await this.pool.query(
      `SELECT c.user_id, u.account_id, a_escrow.id as escrow_account_id, a_revenue.id as revenue_account_id
       FROM contracts c
       JOIN users u ON c.user_id = u.id
       CROSS JOIN accounts a_escrow WHERE a_escrow.name = 'SYSTEM_ESCROW'
       CROSS JOIN accounts a_revenue WHERE a_revenue.name = 'SYSTEM_REVENUE'
       WHERE c.id = $1`,
      [contractId]
    );

    if (contractResult.rows.length === 0) {
      throw new Error(`Contract ${contractId} or system accounts not found for ledger finalization`);
    }
    const row = contractResult.rows[0];

    if (outcome === 'PASS') {
      // Release from Escrow back to User
      await this.ledger.recordTransaction(
        row.escrow_account_id,
        row.account_id,
        amountCents,
        contractId,
        { type: 'REAL_MONEY_SETTLEMENT_RELEASE', outcome: 'PASS' }
      );
    } else {
      // Capture from Escrow to Revenue
      await this.ledger.recordTransaction(
        row.escrow_account_id,
        row.revenue_account_id,
        amountCents,
        contractId,
        { type: 'REAL_MONEY_SETTLEMENT_CAPTURE', outcome: 'FAIL' }
      );
    }
  }
}
