import { Controller, Post, Body, Logger } from '@nestjs/common';
import { PaymentRouterService, PaymentProcessor } from './payment-router.service';
import { CorepayPayoutProvider } from './corepay-payout.provider';

class WebShopCheckoutDto {
  amount!: number;
  currency!: string;
  userId!: string;
  isHighRisk?: boolean;
}

interface CheckoutResponse {
  clientSecret: string;
  processor: PaymentProcessor;
}

@Controller('payments/web-shop')
export class WebShopController {
  private readonly logger = new Logger(WebShopController.name);

  constructor(
    private readonly paymentRouter: PaymentRouterService,
    private readonly corepayProvider: CorepayPayoutProvider,
  ) {}

  @Post('checkout')
  async checkout(@Body() dto: WebShopCheckoutDto): Promise<CheckoutResponse> {
    const processor = this.paymentRouter.determineProcessor(
      { amount: dto.amount, currency: dto.currency, userId: dto.userId, isHighRisk: dto.isHighRisk },
      0,
    );

    if (processor === 'HIGH_RISK_COREPAY' && process.env.COREPAY_API_KEY) {
      const result = await this.corepayProvider.releaseFunds(
        `ws_${dto.userId}_${Date.now()}`,
        dto.amount,
      );

      if (result.status === 'FAILED') {
        throw new Error(`Corepay checkout failed: ${result.error}`);
      }

      return {
        clientSecret: result.providerTransactionId || '',
        processor,
      };
    }

    return this.paymentRouter.createPaymentIntent(
      { amount: dto.amount, currency: dto.currency, userId: dto.userId },
      processor,
    );
  }
}
