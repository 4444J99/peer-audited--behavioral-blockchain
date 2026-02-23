import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { StripeFboService } from './stripe.service';
import { APPEAL_FEE_AMOUNT } from '../billing';

@Injectable()
export class DisputeService {
  constructor(private readonly stripeService: StripeFboService) {}

  /**
   * Initiates an appeal for a rejected audit.
   * Mandates a $5 friction fee to prevent frivolous escalations to the human judge.
   */
  async initiateAppeal(
    userId: string, 
    proofId: string, 
    customerId: string
  ): Promise<{ appealStatus: string; paymentIntentId: string }> {
    try {
      // Attempt to hold the $5.00 appeal fee
      const holdResult = await this.stripeService.holdStake(customerId, APPEAL_FEE_AMOUNT, proofId);

      // APPEAL_INITIATED event is logged by ContractsService.disputeContract()

      return {
        appealStatus: 'FEE_AUTHORIZED_PENDING_REVIEW',
        paymentIntentId: holdResult.id,
      };
    } catch (error: any) {
      throw new HttpException(
        `Appeal Rejected: Could not authorize the $${APPEAL_FEE_AMOUNT} appeal fee. Reason: ${error.message}`,
        HttpStatus.PAYMENT_REQUIRED
      );
    }
  }
}
