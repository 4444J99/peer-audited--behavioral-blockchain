import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import {
  ENTERPRISE_WEBHOOK_QUEUE_NAME,
  getRedisConnectionConfig,
} from '../../../config/queue.config';
import {
  EnterpriseWebhookJob,
  WebhookSubscriptionService,
} from './webhook-subscription.service';
import { WebhookService } from './webhook.service';

@Injectable()
export class EnterpriseWebhookWorker implements OnModuleInit {
  private readonly logger = new Logger(EnterpriseWebhookWorker.name);
  private worker!: Worker;

  constructor(
    private readonly webhook: WebhookService,
    private readonly subscriptions: WebhookSubscriptionService,
  ) {}

  onModuleInit() {
    this.worker = new Worker<EnterpriseWebhookJob>(
      ENTERPRISE_WEBHOOK_QUEUE_NAME,
      async (job: Job<EnterpriseWebhookJob>) => this.process(job),
      { connection: getRedisConnectionConfig(), concurrency: 4 },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Enterprise webhook job ${job?.id} failed: ${err.message}`);
    });

    this.logger.log('Enterprise webhook worker initialized');
  }

  private async process(job: Job<EnterpriseWebhookJob>): Promise<void> {
    const { subscriptionId, url, event } = job.data;

    // dispatchEnterpriseMetricEvent already signs, retries with backoff, and
    // re-runs the SSRF guard against whatever the host resolves to NOW — a URL
    // that was safe at registration can be repointed at an internal address
    // afterwards, so the check belongs here as well as there. That guard REJECTS
    // by throwing, so the failure record is written before the error is re-raised;
    // otherwise a rebound host would leave last_delivery_* frozen at its last
    // success and the support signal would lie.
    let delivered: boolean;
    try {
      delivered = await this.webhook.dispatchEnterpriseMetricEvent(
        url,
        event as unknown as Record<string, unknown>,
      );
    } catch (error) {
      await this.subscriptions.recordDelivery(subscriptionId, false);
      throw error;
    }

    await this.subscriptions.recordDelivery(subscriptionId, delivered);

    if (!delivered) {
      // Surface as a job failure so BullMQ's own retry/backoff owns the next
      // attempt; the subscription row already records that this one missed.
      throw new Error(`Enterprise webhook delivery failed for subscription ${subscriptionId}`);
    }
  }
}
