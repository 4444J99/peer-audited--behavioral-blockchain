import { StripeFboService } from './escrow/stripe.service';
import { LedgerService } from './ledger/ledger.service';
import { TruthLogService } from './ledger/truth-log.service';
import { Pool } from 'pg';

export const MONTHLY_SUBSCRIPTION_PRICE = 1499; // cents ($14.99)
export const TICKET_PRICE_BASE = 499; // cents ($4.99)

/**
 * PI-01: Appeal Friction Fee
 * Charged to users who appeal a Fury audit rejection.
 */
export const APPEAL_FEE_AMOUNT = 500; // cents ($5.00)

export interface IAPResult {
  paymentIntentId: string;
  amount: number;
}

/**
 * Process a one-off ticket purchase for a contract.
 * Creates a Stripe PaymentIntent, records a ledger entry, and logs to TruthLog.
 */
export async function processIAP(
  pool: Pool,
  stripe: StripeFboService,
  ledger: LedgerService,
  truthLog: TruthLogService,
  userId: string,
  contractId: string,
): Promise<IAPResult> {
  // Get user's Stripe customer ID
  const userResult = await pool.query(
    'SELECT stripe_customer_id, account_id FROM users WHERE id = $1',
    [userId],
  );
  if (userResult.rows.length === 0) {
    throw new Error(`User ${userId} not found`);
  }

  const { stripe_customer_id, account_id } = userResult.rows[0];
  if (!stripe_customer_id) {
    throw new Error('User has no payment method on file');
  }

  // PM19: a STABLE per-(user, contract) idempotency key so a retry of this purchase reuses the
  // same PaymentIntent rather than minting a fresh nonce key — which would create a second intent,
  // re-charge TICKET_PRICE_BASE, and post a duplicate ledger entry. The same stable key threads
  // through capture and the ledger posting so the entire purchase is idempotent end-to-end.
  const iapKey = `styx_iap_${userId}_${contractId}`;

  // Create Stripe payment intent for the ticket price
  const paymentIntent = await stripe.holdStake(
    stripe_customer_id,
    TICKET_PRICE_BASE,
    contractId,
    iapKey,
  );

  // Capture immediately — tickets are non-refundable.
  // PM20: verify the capture actually succeeded before recording revenue. If Stripe returns a
  // non-succeeded status WITHOUT throwing, we must NOT write a TICKET_PURCHASE ledger entry /
  // TruthLog event for money that was never collected.
  const captured = await stripe.captureStake(paymentIntent.id);
  if (captured.status !== 'succeeded') {
    throw new Error(
      `IAP capture for contract ${contractId} did not succeed (status: ${captured.status}); ` +
        `revenue not recorded.`,
    );
  }

  // Record in ledger: user → revenue
  if (account_id) {
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
        // reaches the ledger (e.g. after the Stripe call was already idempotent) cannot double-post.
        iapKey,
      );
    }
  }

  // Log to TruthLog
  await truthLog.appendEvent('TICKET_PURCHASED', {
    userId,
    contractId,
    amount: TICKET_PRICE_BASE,
    paymentIntentId: paymentIntent.id,
  });

  return { paymentIntentId: paymentIntent.id, amount: TICKET_PRICE_BASE };
}
