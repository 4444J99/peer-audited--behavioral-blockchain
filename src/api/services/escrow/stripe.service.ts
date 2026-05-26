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

  /**
   * Authorizes a manual-capture hold.
   *
   * @param idempotencyKeyOverride When provided, this STABLE key is used so a function-level
   *   retry (e.g. processIAP re-invoked for the same purchase) reuses the same PaymentIntent
   *   instead of creating — and capturing — a second one (PM19). When omitted, a per-attempt
   *   nonce key is used (the correct default for re-holdable stakes: a contract-scoped key would,
   *   after a cancellation, replay the ORIGINAL cancelled intent instead of creating a fresh hold).
   */
  async holdStake(
    customerId: string,
    amountCents: number,
    contractId: string,
    idempotencyKeyOverride?: string,
  ): Promise<Stripe.PaymentIntent> {
    if (this.isDevMode) {
      this.logger.debug(`[DEV] Mock hold ${amountCents}¢ for contract ${contractId}`);
      return {
        id: `pi_dev_${randomUUID().slice(0, 8)}`,
        status: 'requires_capture',
        amount: amountCents,
        currency: 'usd',
      } as any;
    }
    const idempotencyKey = idempotencyKeyOverride ?? `styx_hold_${contractId}_${randomUUID()}`;
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
      // PM18: surface the partial-capture amount in dev so units/partial-capture bugs are not
      // hidden by an amount-agnostic mock. amount_received reflects what would actually be taken.
      this.logger.debug(
        `[DEV] Mock capture ${paymentIntentId}` +
          (captureAmountCents !== undefined ? ` for ${captureAmountCents}¢` : ' (full hold)'),
      );
      return {
        id: paymentIntentId,
        status: 'succeeded',
        ...(captureAmountCents !== undefined ? { amount_received: captureAmountCents } : {}),
      } as any;
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

    // PM17: the idempotency key must incorporate the capture amount. A fixed
    // `styx_capture_${paymentIntentId}` key reused with a DIFFERENT amount_to_capture (a
    // legitimate re-capture at a partial amount) makes Stripe replay the FIRST request's
    // result and silently ignore the new amount. Including the amount makes each distinct
    // capture amount its own idempotent operation while still deduping true retries.
    const amountKeyPart = captureAmountCents !== undefined ? String(captureAmountCents) : 'full';
    return this.stripe.paymentIntents.capture(paymentIntentId, params, {
      idempotencyKey: `styx_capture_${paymentIntentId}_${amountKeyPart}`,
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

  /**
   * Moves funds to a connected account.
   *
   * PM7: `transfers.create` MUST carry an idempotency key. Without one, any retry (BullMQ,
   * crash-resume, outbox replay, or the stale-PROCESSING reclaim in SettlementWorker) double-pays
   * the destination connected account. The key is derived deterministically from a stable id in
   * `metadata` (sideEffectKey / runId / paymentIntentId / contractId / transferId) plus the
   * destination and amount, so true retries dedupe while genuinely distinct transfers do not
   * collide. Callers SHOULD supply a stable id in metadata; if none is available we fall back to
   * an explicit `idempotencyKey` argument.
   */
  async transferFunds(
    amountCents: number,
    destinationAccountId: string,
    metadata?: Record<string, any>,
    idempotencyKey?: string,
  ): Promise<Stripe.Transfer> {
    if (this.isDevMode) {
      this.logger.debug(`[DEV] Mock transfer ${amountCents}¢ to ${destinationAccountId}`);
      return { id: `tr_dev_${randomUUID().slice(0, 8)}`, amount: amountCents } as any;
    }
    const stableId =
      idempotencyKey ||
      metadata?.sideEffectKey ||
      metadata?.runId ||
      metadata?.transferId ||
      metadata?.paymentIntentId ||
      metadata?.contractId;
    const key = stableId
      ? `styx_transfer_${destinationAccountId}_${stableId}`
      : `styx_transfer_${destinationAccountId}_${amountCents}`;
    return this.stripe.transfers.create(
      {
        amount: amountCents,
        currency: 'usd',
        destination: destinationAccountId,
        metadata,
      },
      { idempotencyKey: key },
    );
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
