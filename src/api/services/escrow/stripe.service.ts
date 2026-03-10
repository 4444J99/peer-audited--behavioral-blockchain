import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { JurisdictionTier } from '../geofencing';

export type StakeDisposition = 'CAPTURE' | 'REFUND';


@Injectable()
export class StripeFboService {
  private readonly logger = new Logger(StripeFboService.name);
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key'; // allow-secret
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock_key')) {
      throw new Error(
        'FATAL: STRIPE_SECRET_KEY is required in production. ' +
        'Set a valid Stripe secret key to prevent mock mode in production.'
      );
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    });
  }

  private get isDevMode(): boolean {
    const key = process.env.STRIPE_SECRET_KEY;
    return !key || key === 'sk_test_mock_key';
  }

  async createCustomer(userId: string, email?: string): Promise<string> {
    if (this.isDevMode) {
      const id = `cus_dev_${randomUUID().slice(0, 8)}`;
      this.logger.debug(`[DEV] Created mock customer ${id}`);
      return id;
    }
    const customer = await this.stripe.customers.create({
      metadata: { styxUserId: userId },
      email,
    });
    return customer.id;
  }

  async holdStake(customerId: string, amountCents: number, contractId: string): Promise<Stripe.PaymentIntent> {
    if (this.isDevMode) {
      this.logger.debug(`[DEV] Mock hold ${amountCents}¢ for contract ${contractId}`);
      return {
        id: `pi_dev_${randomUUID().slice(0, 8)}`,
        status: 'requires_capture',
        amount: amountCents,
        currency: 'usd',
      } as any;
    }
    const intent = await this.stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: 'usd',
        customer: customerId,
        capture_method: 'manual',
        metadata: { contractId },
      },
      { idempotencyKey: `styx_hold_${contractId}` },
    );
    return intent;
  }

  async captureStake(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (this.isDevMode) {
      this.logger.debug(`[DEV] Mock capture ${paymentIntentId}`);
      return { id: paymentIntentId, status: 'succeeded' } as any;
    }
    return this.stripe.paymentIntents.capture(paymentIntentId, undefined, {
      idempotencyKey: `styx_capture_${paymentIntentId}`,
    });
  }

  async retrieveIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (this.isDevMode) {
      this.logger.debug(`[DEV] Mock retrieve ${paymentIntentId}`);
      return { id: paymentIntentId, status: 'succeeded' } as any;
    }
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async cancelHold(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (this.isDevMode) {
      this.logger.debug(`[DEV] Mock cancel ${paymentIntentId}`);
      return { id: paymentIntentId, status: 'canceled' } as any;
    }
    return this.stripe.paymentIntents.cancel(paymentIntentId, undefined, {
      idempotencyKey: `styx_cancel_${paymentIntentId}`,
    });
  }

  async transferFunds(amountCents: number, destinationAccountId: string, metadata?: Record<string, any>): Promise<Stripe.Transfer> {
    if (this.isDevMode) {
      this.logger.debug(`[DEV] Mock transfer ${amountCents}¢ to ${destinationAccountId}`);
      return { id: `tr_dev_${randomUUID().slice(0, 8)}`, amount: amountCents } as any;
    }
    return this.stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: destinationAccountId,
      metadata,
    });
  }

  /**
   * Phase Beta P0-011: Refund-only disposition engine.
   * In TIER_2 (REFUND_ONLY) jurisdictions, forfeited stakes MUST route back to the user
   * as a refund, not captured as platform revenue. This prevents gambling classification.
   *
   * For contract success: always REFUND (return stake to user).
   * For contract failure:
   *   TIER_1 → CAPTURE (platform revenue)
   *   TIER_2 → REFUND (mandatory user refund)
   *   TIER_3 → should not exist (hard-blocked), but defaults to REFUND for safety
   */
  resolveDisposition(
    outcome: 'COMPLETED' | 'FAILED',
    jurisdictionTier: JurisdictionTier,
  ): StakeDisposition {
    // Successful contracts always return stake to user
    if (outcome === 'COMPLETED') {
      return 'REFUND';
    }

    // Failed contracts: only TIER_1 captures as platform revenue
    if (jurisdictionTier === JurisdictionTier.TIER_1) {
      return 'CAPTURE';
    }

    // TIER_2 and TIER_3: refund-only (P0-011 compliance requirement)
    return 'REFUND';
  }
}
