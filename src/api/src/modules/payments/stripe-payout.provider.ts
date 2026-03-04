import { Injectable, Logger } from '@nestjs/common';
import { PayoutProvider, PayoutResult, PayoutStatus } from '../../common/interfaces/payout-provider.interface';
import { StripeFboService } from '../../../services/escrow/stripe.service';

@Injectable()
export class StripePayoutProvider implements PayoutProvider {
  private readonly logger = new Logger(StripePayoutProvider.name);

  constructor(private readonly stripeService: StripeFboService) {}

  async releaseFunds(paymentIntentId: string, _amountCents: number, _metadata?: Record<string, any>): Promise<PayoutResult> {
    try {
      // In our FBO model, releasing funds means canceling the manual hold.
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

  async captureFunds(paymentIntentId: string, _amountCents: number, _metadata?: Record<string, any>): Promise<PayoutResult> {
    try {
      const intent = await this.stripeService.captureStake(paymentIntentId);
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
        case 'canceled': // cancel = successful release
          return PayoutStatus.SUCCESS;
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
