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

  async getTransactionStatus(_providerTransactionId: string): Promise<PayoutStatus> {
    // For MVP, we assume success if the operation didn't throw.
    // Real-world implementation would fetch the PI from Stripe and check status.
    return PayoutStatus.SUCCESS;
  }
}
