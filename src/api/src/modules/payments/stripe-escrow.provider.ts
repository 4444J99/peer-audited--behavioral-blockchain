import { Injectable } from '@nestjs/common';
import { JurisdictionTier } from '../../../services/geofencing';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { resolveStakeDisposition } from '../../../services/escrow/disposition';
import {
  EscrowHold,
  EscrowHoldStatus,
  EscrowProvider,
  EscrowRail,
  StakeDisposition,
} from '../../common/interfaces/payout-provider.interface';

/**
 * Stripe as an escrow *entry* rail.
 *
 * Mirrors `StripePayoutProvider`, which has wrapped the same service for the exit half
 * since Corepay landed — this completes the pair. All Stripe mechanics (idempotency key
 * derivation, partial-capture rules, the real-money interlocks) stay in
 * `StripeFboService`; this adapter only translates the Stripe vocabulary into the
 * rail-neutral one so callers stop depending on `Stripe.PaymentIntent`.
 */
@Injectable()
export class StripeEscrowProvider implements EscrowProvider {
  readonly rail: EscrowRail = 'STRIPE';

  constructor(private readonly stripeService: StripeFboService) {}

  /**
   * Delegated rather than re-derived: only the service knows whether the configured
   * credential is a live one, and that is the single fact this property reports.
   */
  get movesRealMoney(): boolean {
    return this.stripeService.movesRealMoney;
  }

  createCustomer(userId: string, email?: string): Promise<string> {
    return this.stripeService.createCustomer(userId, email);
  }

  async holdStake(
    customerId: string,
    amountCents: number,
    contractId: string,
    idempotencyKeyOverride?: string,
  ): Promise<EscrowHold> {
    const intent = await this.stripeService.holdStake(
      customerId,
      amountCents,
      contractId,
      idempotencyKeyOverride,
    );
    return this.toHold(intent, amountCents);
  }

  async captureStake(holdId: string, captureAmountCents?: number): Promise<EscrowHold> {
    const intent = await this.stripeService.captureStake(holdId, captureAmountCents);
    return this.toHold(intent, captureAmountCents);
  }

  async cancelHold(holdId: string): Promise<EscrowHold> {
    const intent = await this.stripeService.cancelHold(holdId);
    return this.toHold(intent);
  }

  async retrieveHold(holdId: string): Promise<EscrowHold> {
    const intent = await this.stripeService.retrieveIntent(holdId);
    return this.toHold(intent);
  }

  async transferFunds(
    amountCents: number,
    destinationAccountId: string,
    metadata?: Record<string, any>,
    idempotencyKey?: string,
  ): Promise<{ id: string; amountCents: number }> {
    const transfer = await this.stripeService.transferFunds(
      amountCents,
      destinationAccountId,
      metadata,
      idempotencyKey,
    );
    return { id: transfer.id, amountCents: transfer.amount ?? amountCents };
  }

  resolveDisposition(
    outcome: 'COMPLETED' | 'FAILED',
    jurisdictionTier: JurisdictionTier,
  ): StakeDisposition {
    return resolveStakeDisposition(outcome, jurisdictionTier);
  }

  private toHold(
    intent: { id: string; status?: string; amount?: number; currency?: string },
    fallbackAmountCents?: number,
  ): EscrowHold {
    return {
      id: intent.id,
      status: this.toHoldStatus(intent.status),
      amountCents: intent.amount ?? fallbackAmountCents ?? 0,
      currency: intent.currency ?? 'usd',
      rail: this.rail,
    };
  }

  /**
   * Unknown Stripe statuses map to PENDING, never HELD. An authorization we cannot
   * positively identify has not taken custody, and reporting it as HELD would let a
   * contract activate against money nobody is holding.
   */
  private toHoldStatus(status: string | undefined): EscrowHoldStatus {
    switch (status) {
      case 'requires_capture':
        return 'HELD';
      case 'succeeded':
        return 'CAPTURED';
      case 'canceled':
        return 'RELEASED';
      default:
        return 'PENDING';
    }
  }
}
