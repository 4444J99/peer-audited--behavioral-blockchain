import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

export type MeteredEventType = 'phash_scan' | 'gemini_call' | 'anomaly_detection';

type StripeClient = InstanceType<typeof Stripe>;

interface MeteredSubscription {
  subscriptionItemId: string;
  customerId: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: StripeClient;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2026-05-27.dahlia',
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
   * Sends the usage through Stripe Billing Meter Events, keyed by the metric name.
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
    const subscription = await this.getMeteredSubscription(enterpriseId);
    if (!subscription) {
      this.logger.warn(`No metered subscription found for enterprise ${enterpriseId}`);
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const dayBucket = Math.floor(timestamp / 86400);
    const identifier = eventId
      ? `styx_usage_${subscription.subscriptionItemId}_${eventId}`
      : `styx_usage_${subscription.subscriptionItemId}_${metric}_${dayBucket}`;

    await this.stripe.billing.meterEvents.create(
      {
        event_name: metric,
        identifier,
        timestamp,
        payload: {
          stripe_customer_id: subscription.customerId,
          value: String(quantity),
          enterprise_id: enterpriseId,
          subscription_item_id: subscription.subscriptionItemId,
        },
      },
      { idempotencyKey: identifier },
    );

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
  private async getMeteredSubscription(enterpriseId: string): Promise<MeteredSubscription | null> {
    // Guard against Stripe Search Query Language injection. enterpriseId is a UUID
    // in our schema; anything containing quotes/backslashes/control chars could
    // break out of the quoted string literal and alter the query, so reject it.
    const safeEnterpriseId = this.assertSafeQueryValue(enterpriseId);

    const subscriptions = await this.stripe.subscriptions.search({
      query: `metadata["enterpriseId"]:"${safeEnterpriseId}" AND status:"active"`,
      limit: 1,
    });

    const subscription = subscriptions.data[0];
    if (!subscription) return null;

    const customerId = this.resolveStripeCustomerId(subscription.customer);
    if (!customerId) return null;

    const meteredItem = subscription.items.data.find(
      (item) => item.price.recurring?.usage_type === 'metered',
    );

    if (!meteredItem) return null;

    return {
      subscriptionItemId: meteredItem.id,
      customerId,
      currentPeriodStart: meteredItem.current_period_start,
      currentPeriodEnd: meteredItem.current_period_end,
    };
  }

  private resolveStripeCustomerId(customer: unknown): string | null {
    if (typeof customer === 'string') return customer;
    if (customer && typeof customer === 'object' && 'id' in customer) {
      const id = (customer as { id?: unknown }).id;
      return typeof id === 'string' ? id : null;
    }
    return null;
  }

  /**
   * Get a summary of current-period metered usage for an enterprise.
   */
  async getUsageSummary(enterpriseId: string): Promise<{
    totalUsage: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }> {
    const subscription = await this.getMeteredSubscription(enterpriseId);
    if (!subscription) {
      return { totalUsage: 0, currentPeriodStart: new Date(), currentPeriodEnd: new Date() };
    }

    const meters = await this.stripe.billing.meters.list({ status: 'active', limit: 100 });
    const relevantMeters = meters.data.filter((meter) =>
      ['phash_scan', 'gemini_call', 'anomaly_detection'].includes(meter.event_name),
    );

    const summaries = await Promise.all(
      relevantMeters.map((meter) =>
        this.stripe.billing.meters.listEventSummaries(meter.id, {
          customer: subscription.customerId,
          start_time: subscription.currentPeriodStart,
          end_time: subscription.currentPeriodEnd,
          limit: 1,
        }),
      ),
    );

    const totalUsage = summaries.reduce(
      (total, summary) =>
        total + summary.data.reduce((subtotal, current) => subtotal + current.aggregated_value, 0),
      0,
    );

    return {
      totalUsage,
      currentPeriodStart: new Date(subscription.currentPeriodStart * 1000),
      currentPeriodEnd: new Date(subscription.currentPeriodEnd * 1000),
    };
  }
}
