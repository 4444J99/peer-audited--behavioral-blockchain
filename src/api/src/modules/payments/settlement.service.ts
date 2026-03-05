import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Pool } from 'pg';
import { SETTLEMENT_QUEUE_NAME, getDefaultQueueOptions } from '../../../config/queue.config';

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

  constructor(private readonly pool: Pool) {
    this.queue = new Queue(SETTLEMENT_QUEUE_NAME, getDefaultQueueOptions());
  }

  async dispatchSettlement(job: SettlementJob) {
    this.logger.log(`Dispatching settlement for contract ${job.contractId} (${job.outcome})`);
    
    // TKT-P0-003: KYC Runtime Enforcement
    if (job.amountCents > 2000) { // > $20.00
      const kycResult = await this.pool.query(
        "SELECT age_verification_status FROM users u JOIN contracts c ON c.user_id = u.id WHERE c.id = $1",
        [job.contractId]
      );
      if (kycResult.rows[0]?.age_verification_status !== 'VERIFIED') {
        throw new BadRequestException('KYC verification required for settlements above $20.00');
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
    const amountCents = Math.round(Number(row.stake_amount) * 100);
    
    // Simplified breakdown for MVP
    return {
      contractId,
      stakeAmountCents: amountCents,
      platformFeeCents: Math.round(amountCents * 0.1), // 10% fee
      bountyPoolCents: Math.round(amountCents * 0.2), // 20% bounty
      userRefundCents: row.status === 'COMPLETED' ? amountCents : 0,
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
      runs: runs.rows,
      ledgerEntries: ledgerEntries.rows,
    };
  }
}
