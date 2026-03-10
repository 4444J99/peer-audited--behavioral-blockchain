import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Pool } from 'pg';
import { SETTLEMENT_QUEUE_NAME, getDefaultQueueOptions } from '../../../config/queue.config';
import { CompliancePolicyService } from '../compliance/compliance-policy.service';
import { buildSettlementQuote } from './settlement-quote';
import { isKycRequired } from '../../../../shared/config/stake-tiers';
import { JurisdictionDispositionMapper } from '../compliance/jurisdiction-disposition.mapper';
import { toCents } from '../../../../shared/libs/money';

export interface SettlementJob {
  contractId: string;
  outcome: 'PASS' | 'FAIL';
  paymentIntentId: string;
  amountCents: number;
  dispositionMode?: 'CAPTURE' | 'REFUND';
  furies?: string[];
}

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);
  private queue: Queue;

  constructor(
    private readonly pool: Pool,
    private readonly compliancePolicy: CompliancePolicyService,
  ) {
    this.queue = new Queue(SETTLEMENT_QUEUE_NAME, getDefaultQueueOptions());
  }

  async dispatchSettlement(job: SettlementJob) {
    this.logger.log(`Dispatching settlement for contract ${job.contractId} (${job.outcome})`);
    
    // Route settlement-time KYC decisions through the same policy used at contract creation.
    if (isKycRequired(job.amountCents)) {
      const contractResult = await this.pool.query(
        "SELECT user_id FROM contracts WHERE id = $1",
        [job.contractId],
      );
      if (contractResult.rows.length === 0) {
        throw new NotFoundException('Contract not found');
      }

      const kycResult = await this.compliancePolicy.evaluateKycRequirement(
        contractResult.rows[0].user_id,
        job.amountCents / 100,
      );
      if (!kycResult.allowed) {
        throw new BadRequestException(kycResult.reason || 'KYC verification required for settlements above threshold');
      }
    }

    await this.queue.add('settle', job, {
      attempts: 10,
      backoff: { type: 'exponential', delay: 10000 },
      removeOnComplete: true,
      jobId: `settlement_${job.contractId}_${job.outcome}`,
    });
  }

  async getSettlementPreview(contractId: string) {
    const contract = await this.pool.query(
      "SELECT user_id, stake_amount, status FROM contracts WHERE id = $1",
      [contractId]
    );
    if (contract.rows.length === 0) throw new NotFoundException('Contract not found');
    
    const row = contract.rows[0];
    if (row.status !== 'COMPLETED' && row.status !== 'FAILED') {
      throw new BadRequestException('Settlement preview is only available for resolved contracts');
    }

    const amountCents = toCents(Number(row.stake_amount));
    const outcome: 'PASS' | 'FAIL' = row.status === 'COMPLETED' ? 'PASS' : 'FAIL';
    let dispositionMode: 'CAPTURE' | 'REFUND' | undefined;

    if (outcome === 'FAIL') {
      const userResult = await this.pool.query(
        'SELECT last_known_state FROM users WHERE id = $1',
        [row.user_id],
      );
      const lastKnownState = userResult.rows[0]?.last_known_state ?? null;
      const jurisdictionPolicy = lastKnownState
        ? await this.compliancePolicy.getJurisdictionPolicy(lastKnownState)
        : null;
      
      dispositionMode = JurisdictionDispositionMapper.getDispositionMode(jurisdictionPolicy?.tier);
    }

    const quote = buildSettlementQuote(amountCents, outcome, dispositionMode);
    
    return {
      contractId,
      stakeAmountCents: amountCents,
      platformFeeCents: quote.platformFeeCents,
      bountyPoolCents: quote.bountyPoolCents,
      userRefundCents: quote.userRefundCents,
      dispositionMode: dispositionMode ?? 'REFUND',
      actualAction: quote.actualAction,
      status: row.status,
    };
  }

  async getSettlementStatus(contractId: string) {
    const runs = await this.pool.query(
      "SELECT * FROM settlement_runs WHERE contract_id = $1 ORDER BY started_at DESC",
      [contractId]
    );
    
    const ledgerEntries = await this.pool.query(
      "SELECT * FROM entries WHERE contract_id = $1 ORDER BY created_at DESC",
      [contractId]
    );

    return {
      contractId,
      runs: runs.rows.map(run => ({
        id: run.id,
        contractId: run.contract_id,
        outcome: run.outcome,
        amountCents: run.amount_cents,
        status: run.status,
        dispositionMode: run.disposition_mode,
        quote: run.quote_json,
        providerTxId: run.provider_tx_id,
        lastError: run.last_error,
        startedAt: run.started_at,
        completedAt: run.completed_at,
      })),
      ledgerEntries: ledgerEntries.rows.map(entry => ({
        id: entry.id,
        debitAccountId: entry.debit_account_id,
        creditAccountId: entry.credit_account_id,
        amount: entry.amount,
        contractId: entry.contract_id,
        metadata: entry.metadata,
        createdAt: entry.created_at,
      })),
    };
  }
}
