import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { SETTLEMENT_QUEUE_NAME, getDefaultQueueOptions } from '../../../config/queue.config';

export interface SettlementJob {
  contractId: string;
  outcome: 'PASS' | 'FAIL';
  paymentIntentId: string;
  amountCents: number;
  furies?: string[];
}

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);
  private queue: Queue;

  constructor() {
    this.queue = new Queue(SETTLEMENT_QUEUE_NAME, getDefaultQueueOptions());
  }

  async dispatchSettlement(job: SettlementJob) {
    this.logger.log(`Dispatching settlement for contract ${job.contractId} (${job.outcome})`);
    await this.queue.add('settle', job, {
      attempts: 10, // High retry count for financial transactions
      backoff: { type: 'exponential', delay: 10000 }, // 10s, 20s, 40s...
      removeOnComplete: true,
      jobId: `settlement_${job.contractId}_${job.outcome}`, // Idempotency at queue level
    });
  }
}
