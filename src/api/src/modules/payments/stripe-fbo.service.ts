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
    
    // Create a PaymentIntent that routes to the platform's connected FBO account
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      // In a true FBO architecture with Connect, we'd specify transfer_data:
      // transfer_data: { destination: 'acct_fbo_id' },
      metadata: {
        userId,
        contractId,
        purpose: 'BEHAVIORAL_STAKE_ESCROW'
      },
      capture_method: 'automatic', // High-risk often requires immediate capture to FBO
    });

    return paymentIntent.id;
  }

  /**
   * Resolves a contract. 
   * If PASS: Refunds the stake to the user.
   * If FAIL: Uses the canonical provisional failed-capture split from settlement-quote.ts.
   */
  async resolveEscrow(paymentIntentId: string, outcome: 'PASS' | 'FAIL', furies: string[] = []): Promise<boolean> {
    this.logger.log(`Resolving Escrow for PI: ${paymentIntentId}. Outcome: ${outcome}`);

    if (outcome === 'PASS') {
      // User succeeded. Refund the stake completely.
      await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer', // Cleanest refund reason
      });
      this.logger.log(`Stake refunded successfully.`);
      return true;
    } else {
      // User failed. Slashing protocol activated.
      this.logger.warn(`Contract FAILED. Initiating slashing protocol.`);
      
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      const totalAmount = intent.amount;
      const quote = buildSettlementQuote(totalAmount, outcome);

      const platformFee = quote.platformFeeCents;
      const furyBountyPool = quote.bountyPoolCents;

      // Transfer bounties to Fury connected accounts
      if (furies.length > 0) {
        const bountyPerFury = Math.floor(furyBountyPool / furies.length);
        for (const furyId of furies) {
          await this.stripe.transfers.create({
            amount: bountyPerFury,
            currency: 'usd',
            destination: furyId,
            metadata: {
              paymentIntentId,
              purpose: 'FURY_BOUNTY',
            },
          });
          this.logger.log(`Transferred $${bountyPerFury / 100} bounty to Fury ${furyId}`);
        }
      }

      this.logger.log(`Platform captured $${platformFee / 100} fee.`);
      return true;
    }
  }
}
