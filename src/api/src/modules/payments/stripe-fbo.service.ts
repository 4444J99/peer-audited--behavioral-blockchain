import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { buildSettlementQuote } from './settlement-quote';

/**
 * @deprecated Use SettlementModule and SettlementWorker for contract resolution.
 * The canonical truth for payout math is now in settlement-quote.ts, and this
 * legacy service must mirror that logic until it is fully removed.
 * 
 * Stripe FBO (For Benefit Of) Escrow Service
 */
@Injectable()
export class StripeFBOService {
  private readonly logger = new Logger(StripeFBOService.name);
  private stripe: Stripe;

  constructor() {
    // In production, this uses a high-risk merchant account API key
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
      apiVersion: '2023-10-16', // Matched to project stripe dependency
    });
  }

  /**
   * Locks the user's stake into the FBO Escrow via a PaymentIntent.
   * Uses "capture_method: manual" to authorize without taking funds immediately
   * if supported by the risk profile, or captures to FBO immediately.
   */
  async lockStakeInEscrow(userId: string, amountCents: number, contractId: string): Promise<string> {
    this.logger.log(`Locking $${amountCents / 100} in FBO Escrow for contract ${contractId}`);

    // Create a PaymentIntent that routes to the platform's connected FBO account.
    const paymentIntent = await this.stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: 'usd',
        // In a true FBO architecture with Connect, we'd specify transfer_data:
        // transfer_data: { destination: 'acct_fbo_id' },
        metadata: {
          userId,
          contractId,
          purpose: 'BEHAVIORAL_STAKE_ESCROW'
        },
        // PM3: use a MANUAL hold to match the FBO manual-capture model used everywhere else
        // (escrow/stripe.service.ts). Funds are authorized now and only captured on a FAIL
        // resolution; on a PASS the hold is released. Immediate `automatic` capture conflicted
        // with that model and pre-collected funds that may need to be released untouched.
        capture_method: 'manual',
      },
      // PM3: a contract-scoped idempotency key. A BullMQ/Stripe retry of the same stake-lock must
      // not create a second PaymentIntent and double-charge the user.
      { idempotencyKey: `styx_lock_${contractId}` },
    );

    return paymentIntent.id;
  }

  /**
   * Resolves a contract. 
   * If PASS: Refunds the stake to the user.
   * If FAIL: Uses the canonical provisional failed-capture split from settlement-quote.ts.
   */
  async resolveEscrow(
    paymentIntentId: string,
    outcome: 'PASS' | 'FAIL',
    furies: string[] = [],
    contractStakeCents?: number,
  ): Promise<boolean> {
    this.logger.log(`Resolving Escrow for PI: ${paymentIntentId}. Outcome: ${outcome}`);

    if (outcome === 'PASS') {
      // User succeeded. Release the manual hold back to the user.
      // PM3: with the FBO manual-capture model, a successful resolution RELEASES the
      // never-captured authorization (cancel), which returns the held funds to the customer.
      // (A refund only applies to already-captured funds; an uncaptured manual hold is released
      // by cancelling it.)
      await this.stripe.paymentIntents.cancel(
        paymentIntentId,
        { cancellation_reason: 'requested_by_customer' },
        // Idempotency: a BullMQ/Stripe retry of the same resolution must not error/replay.
        { idempotencyKey: `styx_release_${paymentIntentId}` },
      );
      this.logger.log(`Stake released (hold cancelled) successfully.`);
      return true;
    } else {
      // User failed. Slashing protocol activated.
      this.logger.warn(`Contract FAILED. Initiating slashing protocol.`);

      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      // PM2: never split a non-USD intent as if it were USD cents. Fail closed on a currency
      // mismatch rather than capturing/transferring against an amount in a different currency.
      if (intent.currency && intent.currency.toLowerCase() !== 'usd') {
        throw new Error(
          `resolveEscrow: refusing to slash PaymentIntent ${paymentIntentId} in currency ` +
            `'${intent.currency}' (only 'usd' is supported).`,
        );
      }

      // PM2: prefer the server-authoritative contract stake over the live PaymentIntent amount.
      // The PI amount can diverge from the staked amount; the split MUST be computed from the
      // server's source of truth when it is available.
      const totalAmount = contractStakeCents ?? intent.amount;
      const quote = buildSettlementQuote(totalAmount, outcome);

      const platformFee = quote.platformFeeCents;
      const furyBountyPool = quote.bountyPoolCents;

      // PM1: actually CAPTURE the held stake. Previously this path only logged "Platform captured
      // $X" and returned true, leaving the user's funds in `requires_capture` limbo to auto-release
      // — the stake was never slashed. Capture the authoritative total to platform-controlled funds
      // before paying out bounties (Stripe transfers require captured funds to exist).
      await this.stripe.paymentIntents.capture(
        paymentIntentId,
        { amount_to_capture: totalAmount },
        // Include the amount so a re-capture at a corrected amount is its own idempotent op.
        { idempotencyKey: `styx_capture_${paymentIntentId}_${totalAmount}` },
      );
      this.logger.log(`Platform captured $${platformFee / 100} fee (slashed stake $${totalAmount / 100}).`);

      // Transfer bounties to Fury connected accounts.
      if (furies.length > 0) {
        // Distribute the pool deterministically so NO cents are lost to flooring: the base
        // per-fury share goes to everyone, and the leftover remainder cents are handed, one
        // each, to the first `remainder` furies (deterministic ordering).
        const basePerFury = Math.floor(furyBountyPool / furies.length);
        const remainder = furyBountyPool - basePerFury * furies.length;
        for (let i = 0; i < furies.length; i++) {
          const furyId = furies[i];
          const bountyAmount = basePerFury + (i < remainder ? 1 : 0);
          if (bountyAmount <= 0) continue;
          await this.stripe.transfers.create(
            {
              amount: bountyAmount,
              currency: 'usd',
              destination: furyId,
              metadata: {
                paymentIntentId,
                purpose: 'FURY_BOUNTY',
              },
            },
            // Idempotency: keyed per (paymentIntent, fury) so a retry cannot double-pay a fury.
            { idempotencyKey: `styx_bounty_${paymentIntentId}_${furyId}` },
          );
          this.logger.log(`Transferred $${bountyAmount / 100} bounty to Fury ${furyId}`);
        }
      }

      return true;
    }
  }
}
