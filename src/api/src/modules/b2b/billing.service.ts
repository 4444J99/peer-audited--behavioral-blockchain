import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

export type MeteredEventType = 'phash_scan' | 'gemini_call' | 'anomaly_detection';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Enterprise "Consumption Based" billing. Companies are charged per metric generation/insight.
   * Driven by Phase Omega "The Empire" B2B strategy.
   *
   * eventType is constrained to the known metered metrics rather than an arbitrary
   * string cast through `as any`, so callers cannot record bogus/free-text events.
   */
  async recordConsumptionEvent(
    enterpriseId: string,
    eventType: MeteredEventType,
    eventId?: string,
  ): Promise<void> {
    this.logger.log(`Recorded consumption event [${eventType}] for Enterprise: ${enterpriseId}`);
    await this.recordUsage(enterpriseId, eventType, 1, eventId);
  }

  /**
   * Record a metered usage event for an enterprise's Stripe subscription.
   * Increments the usage count on the metered subscription item.
   *
   * PM21: an `action:'increment'` usage record with a `Date.now()` timestamp and at-least-once
   * callers double-bills the enterprise on any retry. When a STABLE `eventId` is supplied we pass
   * it as the Stripe `idempotencyKey` so a retried call collapses to a single increment. When no
   * stable id is available we fall back to `action:'set'` with an idempotency key derived from
   * the (subscriptionItem, metric, day-bucket): 'set' is naturally idempotent for re-delivery of
   * the same value, avoiding the runaway over-count that 'increment' suffers under retries.
   */
  async recordUsage(
    enterpriseId: string,
    metric: 'phash_scan' | 'gemini_call' | 'anomaly_detection',
    quantity: number = 1,
    eventId?: string,
  ): Promise<void> {
    const subscriptionItemId = await this.getMeteredSubscriptionItem(enterpriseId);
    if (!subscriptionItemId) {
      this.logger.warn(`No metered subscription found for enterprise ${enterpriseId}`);
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);

    if (eventId) {
      // Stable event id → idempotent increment.
      await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        { quantity, timestamp, action: 'increment' },
        { idempotencyKey: `styx_usage_${subscriptionItemId}_${eventId}` },
      );
    } else {
      // No stable id: use action 'set', which is idempotent under re-delivery of the same value
      // (re-applying the same total does not over-count), keyed per (item, metric, day-bucket).
      const dayBucket = Math.floor(timestamp / 86400);
      await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        { quantity, timestamp, action: 'set' },
        { idempotencyKey: `styx_usage_${subscriptionItemId}_${metric}_${dayBucket}` },
      );
    }

    this.logger.log(`Recorded ${quantity}x ${metric} usage for enterprise ${enterpriseId}`);
  }

  /**
   * Validate a value that will be interpolated into a Stripe Search query string.
   * Only allows the characters that legitimately appear in our identifiers
   * (UUID-style: alphanumerics and hyphen). Rejects quotes, backslashes and any
   * other character that could alter the query semantics.
   */
  private assertSafeQueryValue(value: string): string {
    if (typeof value !== 'string' || !/^[A-Za-z0-9-]{1,64}$/.test(value)) {
      throw new Error('Invalid enterpriseId: contains characters not permitted in a billing lookup');
    }
    return value;
  }

  /**
   * Find the metered subscription item for an enterprise.
   * Looks up the active subscription with the matching enterpriseId metadata.
   */
  private async getMeteredSubscriptionItem(enterpriseId: string): Promise<string | null> {
    // Guard against Stripe Search Query Language injection. enterpriseId is a UUID
    // in our schema; anything containing quotes/backslashes/control chars could
    // break out of the quoted string literal and alter the query, so reject it.
    const safeEnterpriseId = this.assertSafeQueryValue(enterpriseId);

    const subscriptions = await this.stripe.subscriptions.search({
      query: `metadata["enterpriseId"]:"${safeEnterpriseId}" AND status:"active"`,
      limit: 1,
    });

    if (subscriptions.data.length === 0) return null;

    const meteredItem = subscriptions.data[0].items.data.find(
      (item) => item.price.recurring?.usage_type === 'metered',
    );

    return meteredItem?.id || null;
  }

  /**
   * Get a summary of current-period metered usage for an enterprise.
   */
  async getUsageSummary(enterpriseId: string): Promise<{
    totalUsage: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }> {
    const subscriptionItemId = await this.getMeteredSubscriptionItem(enterpriseId);
    if (!subscriptionItemId) {
      return { totalUsage: 0, currentPeriodStart: new Date(), currentPeriodEnd: new Date() };
    }

    const summary = await this.stripe.subscriptionItems.listUsageRecordSummaries(
      subscriptionItemId,
      { limit: 1 },
    );
    const current = summary.data[0];

    return {
      totalUsage: current?.total_usage || 0,
      currentPeriodStart: new Date((current?.period?.start || 0) * 1000),
      currentPeriodEnd: new Date((current?.period?.end || 0) * 1000),
    };
  }
}
