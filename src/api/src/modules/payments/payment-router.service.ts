import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PayoutProvider } from "../../common/interfaces/payout-provider.interface";
import { StripePayoutProvider } from "./stripe-payout.provider";
import { CorepayPayoutProvider } from "./corepay-payout.provider";

export type PaymentProcessor = "STRIPE" | "HIGH_RISK_COREPAY";

export interface PaymentIntentOptions {
  amount: number;
  currency: string;
  userId: string;
  metadata?: Record<string, string>;
  isHighRisk?: boolean;
}

@Injectable()
export class PaymentRouterService {
  private readonly logger = new Logger(PaymentRouterService.name);


  private readonly DISPUTE_RISK_THRESHOLD = 3;

  constructor(
    private readonly stripeProvider: StripePayoutProvider,
    private readonly corepayProvider: CorepayPayoutProvider,
  ) {}

  determineProcessor(
    options: PaymentIntentOptions,
    userTotalDisputes: number,
  ): PaymentProcessor {
    if (
      options.isHighRisk ||
      userTotalDisputes >= this.DISPUTE_RISK_THRESHOLD
    ) {
      this.logger.warn(
        `Routing transaction for user ${options.userId} to HIGH-RISK processor (Disputes: ${userTotalDisputes})`,
      );
      return "HIGH_RISK_COREPAY";
    }

    return "STRIPE";
  }

  getProvider(processor: PaymentProcessor): PayoutProvider {
    return processor === "STRIPE" ? this.stripeProvider : this.corepayProvider;
  }

  async createPaymentIntent(
    options: PaymentIntentOptions,
    processor: PaymentProcessor,
  ): Promise<{ clientSecret: string; processor: PaymentProcessor }> {
    if (processor === "STRIPE") {
      return {
        clientSecret: intent.client_secret,
        processor,
      };
    }

    return { clientSecret: `tok_corepay_mock_${Date.now()}`, processor };
  }
}
