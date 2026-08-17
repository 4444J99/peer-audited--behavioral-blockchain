import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { JurisdictionTier } from '../geofencing';
import { geofenceFailsOpenOnMissingLocation } from '../../src/modules/compliance/compliance-policy.service';
import { testMoneyModeEnabled } from '../../src/config/runtime';

import { resolveStakeDisposition } from './disposition';
import type { StakeDisposition } from '../../src/common/interfaces/payout-provider.interface';

export type { StakeDisposition };

type StripeClient = InstanceType<typeof Stripe>;
type StripePaymentIntent = Awaited<ReturnType<StripeClient['paymentIntents']['retrieve']>>;
type StripePaymentIntentCaptureParams = NonNullable<Parameters<StripeClient['paymentIntents']['capture']>[1]>;
type StripeTransfer = Awaited<ReturnType<StripeClient['transfers']['create']>>;

@Injectable()
export class StripeFboService {
  private readonly logger = new Logger(StripeFboService.name);
  private stripe: StripeClient;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key'; // allow-secret
    const isProduction = process.env.NODE_ENV === 'production';

    // The test-money rail never calls Stripe. It is valid for the local demo
    // and beta runtime to have no Stripe credential even when the container
    // otherwise uses production optimisations. Requiring a key here made the
    // dependency graph lie: EscrowModule correctly selected LedgerEscrowProvider
    // but constructing this unused adapter still stopped the API from booting.
    if (
      isProduction &&
      !testMoneyModeEnabled() &&
      (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock_key')
    ) {
      throw new Error(
        'FATAL: STRIPE_SECRET_KEY is required in production. ' +
        'Set a valid Stripe secret key to prevent mock mode in production.'
      );
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2026-07-29.dahlia',
    });
  }

  /**
   * No Stripe API call at all — fabricate identifiers locally.
   *
   * True only when there is no credential, or the explicit `sk_test_mock_key` sentinel
   * is set. This is about whether we can *reach* Stripe, and nothing else.
   */
  private get isMockMode(): boolean {
    const key = process.env.STRIPE_SECRET_KEY;
    return !key || key === 'sk_test_mock_key';
  }

  /**
   * Whether money on this rail can leave a real account.
   *
   * Only a live credential moves real money; `sk_test_*` reaches Stripe's test mode,
   * where nothing is real by construction. These two facts used to share one getter
   * (`isDevMode`), which meant an ordinary `sk_test_…` key — the value `.env.example`
   * documents — was treated as real money and every charge path refused to run, while
   * the error text it raised already named the correct predicate ("once
   * STRIPE_SECRET_KEY is a live key"). Splitting them makes the two questions
   * separately answerable: "can we call Stripe?" and "is this real?".
   */
  get movesRealMoney(): boolean {
    const key = process.env.STRIPE_SECRET_KEY ?? '';
    return key.startsWith('sk_live_') || key.startsWith('rk_live_');
  }

  /**
   * Gate on the controls that must be on before real money moves.
   *
   * This lives on the charge, not on a controller. A `StripeProductionGuard`
   * decorating `PaymentsController` would miss `POST /contracts`, which calls
   * `holdStake` directly, and would also reject `POST /payments/webhook` —
   * blocking Stripe from settling transactions that were created *before* a
   * control was switched off. Charging is the thing to gate; reporting is not.
   *
   * All three defaults are the Phase 1 pilot's settings, which are correct for a
   * test-money beta and wrong the moment a live key appears. Nothing connected
   * those facts, so this makes the coupling structural.
   */
  private assertRealMoneyAllowed(operation: string): void {
    if (!this.movesRealMoney) return; // test mode or mock; nothing real can move

    if (geofenceFailsOpenOnMissingLocation()) {
      throw new Error(
        `Refusing to ${operation} with real money while the geofence fails open: an ` +
          'unresolvable location would be granted FULL_ACCESS, defeating the US-only ' +
          'boundary (DR-003). Unset GEO_MISSING_HEADER_ACTION or set it to "block".',
      );
    }

    if (String(process.env.KYC_ENFORCEMENT_ENABLED).toLowerCase() !== 'true') {
      throw new Error(
        `Refusing to ${operation} with real money while KYC enforcement is disabled. ` +
          'KYC_ENFORCEMENT_ENABLED must be "true" once STRIPE_SECRET_KEY is a live key.',
      );
    }

    // Defaults on, so real money requires deliberately setting it to false.
    if (String(process.env.STYX_TEST_MONEY_MODE ?? 'true').toLowerCase() !== 'false') {
      throw new Error(
        `Refusing to ${operation} with real money while STYX_TEST_MONEY_MODE is on — ` +
          'every tester-facing surface is currently labelled a test-money pilot. ' +
          'Set STYX_TEST_MONEY_MODE=false to activate real money.',
      );
    }
  }

  async createCustomer(userId: string, email?: string): Promise<string> {
    if (this.isMockMode) {
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
  ): Promise<StripePaymentIntent> {
    this.assertRealMoneyAllowed('authorize a hold');
    if (this.isMockMode) {
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
  async captureStake(paymentIntentId: string, captureAmountCents?: number): Promise<StripePaymentIntent> {
    this.assertRealMoneyAllowed('capture a stake');
    if (this.isMockMode) {
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

    const params: StripePaymentIntentCaptureParams =
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

  async retrieveIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    if (this.isMockMode) {
      this.logger.debug(`[DEV] Mock retrieve ${paymentIntentId}`);
      return { id: paymentIntentId, status: 'succeeded' } as any;
    }
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async cancelHold(paymentIntentId: string): Promise<StripePaymentIntent> {
    if (this.isMockMode) {
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
  ): Promise<StripeTransfer> {
    this.assertRealMoneyAllowed('transfer funds');
    if (this.isMockMode) {
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
   *
   * Jurisdiction policy, not rail mechanics — the answer must be identical whether the
   * stake sits on Stripe or the internal ledger, so the implementation lives in
   * `./disposition` and every rail delegates to it.
   */
  resolveDisposition(
    outcome: 'COMPLETED' | 'FAILED',
    jurisdictionTier: JurisdictionTier,
  ): StakeDisposition {
    return resolveStakeDisposition(outcome, jurisdictionTier);
  }
}
