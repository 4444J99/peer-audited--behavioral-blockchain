import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

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
   */
  async recordConsumptionEvent(enterpriseId: string, eventType: string): Promise<void> {
    this.logger.log(`Recorded consumption event [${eventType}] for Enterprise: ${enterpriseId}`);
    await this.recordUsage(enterpriseId, eventType as any);
  }

  /**
   * Record a metered usage event for an enterprise's Stripe subscription.
   * Increments the usage count on the metered subscription item.
   */
  async recordUsage(
    enterpriseId: string,
    metric: 'phash_scan' | 'gemini_call' | 'anomaly_detection',
    quantity: number = 1,
  ): Promise<void> {
    const subscriptionItemId = await this.getMeteredSubscriptionItem(enterpriseId);
    if (!subscriptionItemId) {
      this.logger.warn(`No metered subscription found for enterprise ${enterpriseId}`);
      return;
    }

    await this.stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment',
    });

    this.logger.log(`Recorded ${quantity}x ${metric} usage for enterprise ${enterpriseId}`);
  }

  /**
   * Find the metered subscription item for an enterprise.
   * Looks up the active subscription with the matching enterpriseId metadata.
   */
  private async getMeteredSubscriptionItem(enterpriseId: string): Promise<string | null> {
    const subscriptions = await this.stripe.subscriptions.search({
      query: `metadata["enterpriseId"]:"${enterpriseId}" AND status:"active"`,
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
