import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

export type PaymentProcessor = 'STRIPE' | 'HIGH_RISK_COREPAY';

export interface PaymentIntentOptions {
  amount: number;
  currency: string;
  userId: string;
  metadata?: Record<string, string>;
  isHighRisk?: boolean; // Flag to force high-risk routing
}

@Injectable()
export class PaymentRouterService {
  private readonly logger = new Logger(PaymentRouterService.name);

  // Fallback threshold: if a user has &gt; X disputes, automatically route to high-risk processor
  private readonly DISPUTE_RISK_THRESHOLD = 3;

  /**
   * Determines the safest payment processor for a given transaction.
   * Prevents Stripe shadow-bans by routing high-contention volume to Corepay/Allied Wallet.
   */
  determineProcessor(options: PaymentIntentOptions, userTotalDisputes: number): PaymentProcessor {
    if (options.isHighRisk || userTotalDisputes >= this.DISPUTE_RISK_THRESHOLD) {
      this.logger.warn(`Routing transaction for user ${options.userId} to HIGH-RISK processor (Disputes: ${userTotalDisputes})`);
      return 'HIGH_RISK_COREPAY';
    }

    this.logger.log(`Routing transaction for user ${options.userId} to primary processor (STRIPE)`);
    return 'STRIPE';
  }

  /**
   * Creates a payment intent via the selected processor.
   * In dev/test, returns mock client secrets. In production, throws until
   * a real processor integration is configured.
   */
  async createPaymentIntent(options: PaymentIntentOptions, processor: PaymentProcessor): Promise<{ clientSecret: string, processor: PaymentProcessor }> {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      throw new ServiceUnavailableException('Payment processor not configured');
    }

    if (processor === 'STRIPE') {
      // Defer to existing StripeFboService in a real implementation
      return { clientSecret: `pi_stripe_mock_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`, processor };
    } else {
      // Defer to Corepay SDK in a real implementation
      return { clientSecret: `tok_corepay_mock_${Date.now()}`, processor };
    }
  }
}
