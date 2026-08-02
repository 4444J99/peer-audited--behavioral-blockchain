import { JurisdictionTier } from '../../../services/geofencing';

export enum PayoutStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface PayoutResult {
  status: PayoutStatus;
  providerTransactionId?: string;
  error?: string;
  rawResponse?: any;
}

export interface PayoutProvider {
  /**
   * Release funds from escrow back to the user (Pass outcome).
   */
  releaseFunds(paymentIntentId: string, amountCents: number, metadata?: Record<string, any>): Promise<PayoutResult>;

  /**
   * Capture funds from escrow to system revenue (Fail outcome).
   */
  captureFunds(paymentIntentId: string, amountCents: number, metadata?: Record<string, any>): Promise<PayoutResult>;

  /**
   * Check the status of a transaction.
   */
  getTransactionStatus(providerTransactionId: string): Promise<PayoutStatus>;
}

/**
 * The rail a stake is actually held on.
 *
 * LEDGER is not a mock: the hold is a real double-entry posting against
 * SYSTEM_ESCROW, so balances, integrity checks and reconciliation all exercise the
 * same code paths an external rail would — with no outside money attached.
 */
export type EscrowRail = 'STRIPE' | 'COREPAY' | 'LEDGER';

/**
 * Rail-neutral view of an authorized stake.
 *
 * `PayoutProvider` deliberately speaks in `paymentIntentId` strings because it was
 * written when Stripe was the only rail. Everything that crosses the *entry* boundary
 * uses this shape instead, so no caller has to know a Stripe PaymentIntent from a
 * ledger entry id.
 */
export interface EscrowHold {
  /** Rail-scoped identifier. Stored in `contracts.payment_intent_id`. */
  id: string;
  status: EscrowHoldStatus;
  amountCents: number;
  currency: string;
  rail: EscrowRail;
}

/**
 * PENDING covers rails that report an authorization still in flight (Stripe's
 * `processing` / `requires_action` / `requires_payment_method`). It is deliberately
 * distinct from HELD: only HELD means custody was actually taken.
 */
export type EscrowHoldStatus = 'PENDING' | 'HELD' | 'CAPTURED' | 'RELEASED';

export type StakeDisposition = 'CAPTURE' | 'REFUND';

/**
 * The entry half of escrow: taking custody of a stake.
 *
 * `PayoutProvider` (above) abstracts the exit — release / capture / status — and has
 * had two adapters since Corepay landed. The entry half had none: callers injected
 * `StripeFboService` directly, so a user whose *payout* was routed to Corepay still had
 * their stake *held* by Stripe. That asymmetry is also why "is this real money?"
 * degenerated into inspecting the shape of the Stripe API key: with only one entry rail
 * there was nothing else to ask.
 *
 * `movesRealMoney` replaces that inference. An adapter declares it, because an adapter
 * is the only thing that knows.
 *
 * KNOWN GAP — Corepay has no entry adapter. Its contracted API
 * (`corepay-payout.provider.ts`) covers release / capture / status; no authorization
 * endpoint is specified anywhere in this repo, and inventing one would be a stub wearing
 * an implementation's clothes. Until high-risk merchant underwriting lands, high-risk
 * users are held on the configured entry rail and settled through Corepay — the same
 * behavior as before this port existed, now visible instead of implicit.
 */
export interface EscrowProvider {
  readonly rail: EscrowRail;

  /**
   * Whether funds on this rail can leave a real account. Gates the pilot interlocks in
   * `assertRealMoneyAllowed`; a declared property of the rail, never a guess about a
   * credential's format.
   */
  readonly movesRealMoney: boolean;

  /** Idempotent: returns a stable customer handle for the rail. */
  createCustomer(userId: string, email?: string): Promise<string>;

  /**
   * Authorize a hold. `idempotencyKeyOverride` must be a STABLE key when the caller may
   * retry the same logical purchase; omit it for re-holdable stakes, where a
   * contract-scoped key would replay an earlier cancelled hold.
   */
  holdStake(
    customerId: string,
    amountCents: number,
    contractId: string,
    idempotencyKeyOverride?: string,
  ): Promise<EscrowHold>;

  /** Capture a previously authorized hold, in full or (when supported) in part. */
  captureStake(holdId: string, captureAmountCents?: number): Promise<EscrowHold>;

  /** Release the full authorization back to the user. */
  cancelHold(holdId: string): Promise<EscrowHold>;

  retrieveHold(holdId: string): Promise<EscrowHold>;

  transferFunds(
    amountCents: number,
    destinationAccountId: string,
    metadata?: Record<string, any>,
    idempotencyKey?: string,
  ): Promise<{ id: string; amountCents: number }>;

  /** Jurisdiction disposition policy. Rail-independent; see `resolveStakeDisposition`. */
  resolveDisposition(
    outcome: 'COMPLETED' | 'FAILED',
    jurisdictionTier: JurisdictionTier,
  ): StakeDisposition;
}

/** DI token for the configured entry rail. */
export const ESCROW_PROVIDER = Symbol('ESCROW_PROVIDER');
