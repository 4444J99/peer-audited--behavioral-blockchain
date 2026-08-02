import { EscrowProvider } from '../src/common/interfaces/payout-provider.interface';
import { LedgerService } from './ledger/ledger.service';
import { TruthLogService } from './ledger/truth-log.service';
import { Pool } from 'pg';

export const MONTHLY_SUBSCRIPTION_PRICE = 1499; // cents ($14.99)
export const TICKET_PRICE_BASE = 499; // cents ($4.99)

/**
 * PI-01: Appeal Friction Fee
 * Charged to users who appeal a Fury audit rejection.
 *
 * DR-004 (decided 2026-03-10 by Jessica, business lead — see
 * docs/planning/planning--founder-decisions-of-record.md): the appeal fee is
 * REMOVED for the beta cohort. Appeals are submitted at no cost.
 *
 *   "Cohort size is small enough to be reviewed without creating an operational
 *    burden. if we see high volume of frivolous appeals as product scales, we can
 *    introduce a small $5 appeal fee to discourage abuse."
 *
 * So the fee is deferred, not deleted: the amount and the whole hold/capture
 * mechanism stay, gated by the flag below.
 *
 * Note this cannot be expressed by setting the amount to 0 — Stripe rejects a
 * zero-amount authorization, so `initiateAppeal` would fail closed and nobody
 * could appeal at all.
 */
export const APPEAL_FEE_AMOUNT = 500; // cents ($5.00)

/**
 * Whether to charge {@link APPEAL_FEE_AMOUNT} before accepting an appeal.
 * Defaults OFF per DR-004; set STYX_APPEAL_FEE_ENABLED=true to reinstate it.
 */
export function isAppealFeeEnabled(): boolean {
  return String(process.env.STYX_APPEAL_FEE_ENABLED).toLowerCase() === 'true';
}

export interface IAPResult {
  paymentIntentId: string;
  amount: number;
}

/**
 * Process a one-off ticket purchase for a contract.
 * Creates a hold + capture on the configured escrow rail, records a ledger entry,
 * and logs to TruthLog.
 */
export async function processIAP(
  pool: Pool,
  escrow: EscrowProvider,
  ledger: LedgerService,
  truthLog: TruthLogService,
  userId: string,
  contractId: string,
): Promise<IAPResult> {
  // Get the user's rail-scoped customer handle
  const userResult = await pool.query(
    'SELECT email, stripe_customer_id, account_id FROM users WHERE id = $1',
    [userId],
  );
  if (userResult.rows.length === 0) {
    throw new Error(`User ${userId} not found`);
  }

  const { email, stripe_customer_id, account_id } = userResult.rows[0];

  // The handle is rail-scoped: the ledger rail holds from the user's ledger
  // account (provisioned on demand), the Stripe rail from the customer handle.
  let customerHandle: string;
  if (escrow.rail === 'LEDGER') {
    customerHandle = account_id
      ? account_id
      : await escrow.createCustomer(userId, email);
  } else {
    if (!stripe_customer_id) {
      throw new Error('User has no payment method on file');
    }
    customerHandle = stripe_customer_id;
  }

  // PM19: a STABLE per-(user, contract) idempotency key so a retry of this purchase reuses the
  // same hold rather than minting a fresh nonce key — which would create a second hold,
  // re-charge TICKET_PRICE_BASE, and post a duplicate ledger entry. The same stable key threads
  // through capture and the ledger posting so the entire purchase is idempotent end-to-end.
  const iapKey = `styx_iap_${userId}_${contractId}`;

  // Authorize the hold for the ticket price
  const hold = await escrow.holdStake(
    customerHandle,
    TICKET_PRICE_BASE,
    contractId,
    iapKey,
  );

  // Capture immediately — tickets are non-refundable.
  // PM20: verify the capture actually succeeded before recording revenue. If the rail returns
  // a non-CAPTURED status WITHOUT throwing, we must NOT write a TICKET_PURCHASE ledger entry /
  // TruthLog event for money that was never collected.
  const captured = await escrow.captureStake(hold.id);
  if (captured.status !== 'CAPTURED') {
    throw new Error(
      `IAP capture for contract ${contractId} did not succeed (status: ${captured.status}); ` +
        `revenue not recorded.`,
    );
  }

  // Record in ledger: user → revenue
  // On the ledger rail the hold+capture postings already moved the funds
  // user → SYSTEM_ESCROW → SYSTEM_REVENUE; this entry is the Stripe-rail mirror.
  if (account_id && escrow.rail !== 'LEDGER') {
    const revenueResult = await pool.query(
      `SELECT id FROM accounts WHERE name = 'SYSTEM_REVENUE' LIMIT 1`,
    );
    if (revenueResult.rows.length > 0) {
      await ledger.recordTransaction(
        account_id,
        revenueResult.rows[0].id,
        TICKET_PRICE_BASE,
        contractId,
        { type: 'TICKET_PURCHASE', userId },
        undefined,
        // PM19: DB-enforced single-posting for the ticket revenue entry, so even a retry that
        // reaches the ledger (e.g. after the rail call was already idempotent) cannot double-post.
        iapKey,
      );
    }
  }

  // Log to TruthLog
  await truthLog.appendEvent('TICKET_PURCHASED', {
    userId,
    contractId,
    amount: TICKET_PRICE_BASE,
    paymentIntentId: hold.id,
  });

  return { paymentIntentId: hold.id, amount: TICKET_PRICE_BASE };
}
