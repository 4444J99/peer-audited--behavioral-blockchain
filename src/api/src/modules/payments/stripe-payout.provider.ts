import { Injectable, Logger } from '@nestjs/common';
import { PayoutProvider, PayoutResult, PayoutStatus } from '../../common/interfaces/payout-provider.interface';
import { StripeFboService } from '../../../services/escrow/stripe.service';

@Injectable()
export class StripePayoutProvider implements PayoutProvider {
  private readonly logger = new Logger(StripePayoutProvider.name);

  constructor(private readonly stripeService: StripeFboService) {}

  async releaseFunds(paymentIntentId: string, amountCents: number, _metadata?: Record<string, any>): Promise<PayoutResult> {
    try {
      // PM27: in our FBO model "releasing" funds means CANCELLING the manual hold, which always
      // returns the ENTIRE authorization to the customer — there is no partial-cancel primitive.
      // Previously the amountCents argument was silently ignored, so a request to release only a
      // PARTIAL amount would release everything while the ledger recorded only amountCents,
      // diverging real money from the ledger. Since only a FULL release is supported, we assert
      // the requested amount equals the full authorized hold and fail closed on a mismatch rather
      // than releasing more than the ledger will record. (A true partial refund must be modeled as
      // a partial CAPTURE of the kept portion, not a release.)
      const current = await this.stripeService.retrieveIntent(paymentIntentId);
      const authorized = typeof current.amount === 'number' ? current.amount : undefined;
      if (authorized !== undefined && authorized !== amountCents) {
        const msg =
          `Refusing partial release of PaymentIntent ${paymentIntentId}: requested ${amountCents}¢ ` +
          `but the hold authorizes ${authorized}¢. Cancelling a hold releases the full amount; ` +
          `a partial release is not supported on this path.`;
        this.logger.error(msg);
        return { status: PayoutStatus.FAILED, error: msg };
      }

      const intent = await this.stripeService.cancelHold(paymentIntentId);
      return {
        status: PayoutStatus.SUCCESS,
        providerTransactionId: intent.id,
        rawResponse: intent,
      };
    } catch (err: any) {
      this.logger.error(`Stripe release failed: ${err.message}`);
      return {
        status: PayoutStatus.FAILED,
        error: err.message,
      };
    }
  }

  async captureFunds(paymentIntentId: string, amountCents: number, _metadata?: Record<string, any>): Promise<PayoutResult> {
    try {
      // Pass the settlement amount so partial captures take only `amountCents`, not the full
      // authorized hold. (Previously amountCents was ignored, so partial settlement captured
      // the entire stake.)
      //
      // Fury bounties: the `_metadata.furies` array is NOT paid out here. In the canonical
      // architecture the slashed stake is captured to platform revenue and the bounty share is
      // moved to the FURY_BOUNTY_POOL *ledger* account by SettlementWorker.finalizeLedger
      // (BOUNTY_POOL_TOPUP). Individual auditors are then paid from that pool internally by the
      // fury worker — there is no Stripe transfer to per-fury connected accounts on this path.
      // The array is therefore intentionally not wired to a Stripe payout here.
      const intent = await this.stripeService.captureStake(paymentIntentId, amountCents);
      return {
        status: PayoutStatus.SUCCESS,
        providerTransactionId: intent.id,
        rawResponse: intent,
      };
    } catch (err: any) {
      this.logger.error(`Stripe capture failed: ${err.message}`);
      return {
        status: PayoutStatus.FAILED,
        error: err.message,
      };
    }
  }

  async getTransactionStatus(providerTransactionId: string): Promise<PayoutStatus> {
    try {
      const intent = await this.stripeService.retrieveIntent(providerTransactionId);
      switch (intent.status) {
        case 'succeeded':
          return PayoutStatus.SUCCESS;
        case 'canceled': {
          // PM25: be CONSERVATIVE about a null cancellation_reason. A deliberate operator/user
          // release uses 'requested_by_customer', but a null reason is AMBIGUOUS — Stripe also
          // surfaces null for an auto-expiry of an uncaptured hold (an involuntary cancellation
          // where no settlement was intended). Mapping null → SUCCESS would mark such an
          // involuntary cancel as a successful release (the opposite of fail-closed). So treat
          // ONLY an explicit 'requested_by_customer' as a successful release; every other reason,
          // including null/undefined, is reported as FAILED so settlement does not silently
          // finalize on an uncaptured/expired hold.
          const reason = (intent as any).cancellation_reason as string | null | undefined;
          const deliberateRelease = reason === 'requested_by_customer';
          return deliberateRelease ? PayoutStatus.SUCCESS : PayoutStatus.FAILED;
        }
        case 'requires_capture':
        case 'processing':
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
          return PayoutStatus.PENDING;
        default:
          return PayoutStatus.FAILED;
      }
    } catch (err: any) {
      this.logger.error(`Failed to check transaction status: ${err.message}`);
      return PayoutStatus.FAILED;
    }
  }
}
