import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Pool } from 'pg';
import {
  ENTERPRISE_WEBHOOK_QUEUE_NAME,
  getDefaultQueueOptions,
} from '../../../config/queue.config';
import { AnonymizeService } from './anonymize.service';
import { WebhookService } from './webhook.service';

export interface WebhookSubscription {
  id: string;
  enterpriseId: string;
  url: string;
  active: boolean;
  lastDeliveryAt: string | null;
  lastDeliveryOk: boolean | null;
}

/**
 * What an enterprise consumer actually receives.
 *
 * `subject` is the salted pseudonym from AnonymizeService — the same one the HR
 * export uses, so an employer can follow one employee's engagement over time
 * without ever holding their identity. There is deliberately no goal, category,
 * stake amount, or proof reference in here: the employer funds the pot and is
 * entitled to know that engagement happened, not to what a person is working on.
 */
export interface EnterpriseWebhookEvent {
  type: 'CONTRACT_RESOLVED';
  enterpriseId: string;
  subject: string;
  outcome: 'COMPLETED' | 'FAILED';
  occurredAt: string;
}

export interface EnterpriseWebhookJob {
  subscriptionId: string;
  url: string;
  event: EnterpriseWebhookEvent;
}

@Injectable()
export class WebhookSubscriptionService {
  private readonly logger = new Logger(WebhookSubscriptionService.name);
  private readonly queue: Queue;

  constructor(
    private readonly pool: Pool,
    private readonly webhook: WebhookService,
    private readonly anonymize: AnonymizeService,
  ) {
    this.queue = new Queue(ENTERPRISE_WEBHOOK_QUEUE_NAME, getDefaultQueueOptions());
  }

  /**
   * Persist a registration after putting the URL through the same SSRF guard the
   * delivery path uses. Validating at registration matters independently: without
   * it an internal address would sit in the table until a contract resolved, and
   * the rejection would then surface as an outbox failure on someone's settlement
   * rather than as a 400 on the call that made the mistake.
   */
  async register(
    enterpriseId: string,
    url: string,
    registeredBy: string,
  ): Promise<WebhookSubscription> {
    try {
      await this.webhook.assertDeliverableUrl(url);
    } catch (error: any) {
      throw new BadRequestException(error?.message || 'Invalid webhook URL');
    }

    const result = await this.pool.query(
      `INSERT INTO webhook_subscriptions (enterprise_id, url, registered_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (enterprise_id, url) DO UPDATE
         SET active = TRUE,
             registered_by = EXCLUDED.registered_by,
             updated_at = NOW()
       RETURNING id, enterprise_id, url, active, last_delivery_at, last_delivery_ok`,
      [enterpriseId, url, registeredBy],
    );

    return this.toSubscription(result.rows[0]);
  }

  async listActive(enterpriseId: string): Promise<WebhookSubscription[]> {
    const result = await this.pool.query(
      `SELECT id, enterprise_id, url, active, last_delivery_at, last_delivery_ok
       FROM webhook_subscriptions
       WHERE enterprise_id = $1 AND active
       ORDER BY created_at ASC`,
      [enterpriseId],
    );
    return result.rows.map((row: any) => this.toSubscription(row));
  }

  /**
   * Fan a resolved contract out to every active subscription of the owning
   * enterprise.
   *
   * Only ENQUEUES: this runs inside the contract-resolution outbox drain, which
   * is synchronous with settlement, so an unreachable customer endpoint must not
   * be able to slow or fail the money path. Delivery (and its retries) belongs to
   * EnterpriseWebhookWorker. What can still fail here — Redis, the database — is
   * genuine infrastructure, and the outbox is the right place to retry it.
   *
   * Returns the number of jobs enqueued so the caller can log a real number
   * instead of assuming a fan-out happened.
   */
  async enqueueContractResolved(input: {
    enterpriseId: string;
    userId: string;
    outcome: 'COMPLETED' | 'FAILED';
    occurredAt: string;
  }): Promise<number> {
    const subscriptions = await this.listActive(input.enterpriseId);
    if (subscriptions.length === 0) {
      return 0;
    }

    const event: EnterpriseWebhookEvent = {
      type: 'CONTRACT_RESOLVED',
      enterpriseId: input.enterpriseId,
      subject: this.anonymize.hashUserId(input.userId, input.enterpriseId),
      outcome: input.outcome,
      occurredAt: input.occurredAt,
    };

    for (const subscription of subscriptions) {
      const job: EnterpriseWebhookJob = {
        subscriptionId: subscription.id,
        url: subscription.url,
        event,
      };
      await this.queue.add('enterprise-webhook', job);
    }

    this.logger.log(
      `Enqueued ${subscriptions.length} enterprise webhook delivery(ies) for ${input.enterpriseId} [${input.outcome}]`,
    );
    return subscriptions.length;
  }

  async recordDelivery(subscriptionId: string, ok: boolean): Promise<void> {
    await this.pool.query(
      `UPDATE webhook_subscriptions
       SET last_delivery_at = NOW(),
           last_delivery_ok = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [subscriptionId, ok],
    );
  }

  private toSubscription(row: any): WebhookSubscription {
    return {
      id: row.id,
      enterpriseId: row.enterprise_id,
      url: row.url,
      active: row.active,
      lastDeliveryAt: row.last_delivery_at ?? null,
      lastDeliveryOk: row.last_delivery_ok ?? null,
    };
  }
}
