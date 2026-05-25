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
    // Idempotency key must be unique PER ATTEMPT. A contract-scoped key
    // (e.g. styx_hold_${contractId}) would, after a hold is cancelled, replay the
    // ORIGINAL cancelled PaymentIntent instead of creating a fresh hold. The nonce
    // ensures a re-hold after cancellation creates a new intent while still
    // deduplicating accidental double-submits of the same attempt.
    const idempotencyKey = `styx_hold_${contractId}_${randomUUID()}`;
    const intent = await this.stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: 'usd',
        customer: customerId,
        capture_method: 'manual',
        metadata: { contractId },
      },
      { idempotencyKey },
    );
    return intent;
  }

  /**
   * Captures a previously authorized (manual capture_method) hold.
   *
   * @param captureAmountCents Optional partial capture amount in integer cents. When omitted,
   *   Stripe captures the full authorized amount. Supplying it enables partial settlement.
   *
   * Idempotency: settlement retries must be safe. If a prior attempt captured the intent but
   * crashed before the run was marked SUCCESS (e.g. finalizeSettlement threw), the retry will
   * retrieve the intent already in `succeeded`. That is the desired end state, so we return it
   * as success WITHOUT re-capturing — otherwise the ledger entry would never be written and the
   * job would retry forever. We only throw for genuinely invalid states (e.g. `canceled`), where
   * capture can never succeed and a fast, clear error beats an opaque Stripe failure.
   */
  async captureStake(paymentIntentId: string, captureAmountCents?: number): Promise<Stripe.PaymentIntent> {
    if (this.isDevMode) {
      this.logger.debug(`[DEV] Mock capture ${paymentIntentId}`);
      return { id: paymentIntentId, status: 'succeeded' } as any;
    }

    const current = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    // Already captured by a prior (possibly crashed) attempt — treat as success so the
    // caller can proceed to finalize the ledger idempotently instead of throwing.
    if (current.status === 'succeeded') {
      this.logger.debug(`Capture for PaymentIntent ${paymentIntentId} already succeeded; returning idempotently.`);
      return current;
    }

    if (current.status !== 'requires_capture') {
      throw new Error(
        `Cannot capture PaymentIntent ${paymentIntentId}: expected status 'requires_capture' but found '${current.status}'`,
      );
    }

    const params: Stripe.PaymentIntentCaptureParams =
      captureAmountCents !== undefined ? { amount_to_capture: captureAmountCents } : {};

    return this.stripe.paymentIntents.capture(paymentIntentId, params, {
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
