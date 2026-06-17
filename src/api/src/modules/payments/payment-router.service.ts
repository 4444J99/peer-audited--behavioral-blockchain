import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomBytes } from "crypto";

export type PaymentProcessor = "STRIPE" | "HIGH_RISK_COREPAY";

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

    this.logger.log(
      `Routing transaction for user ${options.userId} to primary processor (STRIPE)`,
    );
    return "STRIPE";
  }

  /**
   * Creates a payment intent via the selected processor.
   *
   * The mock client-secret fallback is ALLOWLISTED to `development`/`test`
   * only. Any other environment — `staging`, `production`, or an
   * unset/misconfigured NODE_ENV — fails closed with a 503 rather than
   * silently handing the frontend a fabricated `pi_stripe_mock_*` secret
   * that Stripe.js can never redeem (see issue #32). This must be a
   * fail-closed allowlist, not a `=== "production"` blocklist, so that a
   * staging or misconfigured deployment cannot leak a fake secret.
   */
  async createPaymentIntent(
    options: PaymentIntentOptions,
    processor: PaymentProcessor,
  ): Promise<{ clientSecret: string; processor: PaymentProcessor }> {
    const nodeEnv = process.env.NODE_ENV;
    const mockFallbackAllowed = nodeEnv === "development" || nodeEnv === "test";
    if (!mockFallbackAllowed) {
      throw new ServiceUnavailableException("Payment processor not configured");
    }

    this.logger.warn(
      `Using MOCK payment processor (${processor}) for user ${options.userId} in "${nodeEnv}" environment; ` +
        "no real charge will be created. This path is only valid for local development/testing.",
    );

    if (processor === "STRIPE") {
      // Defer to existing StripeFboService in a real implementation
      return {
        clientSecret: `pi_stripe_mock_${Date.now()}_secret_${randomBytes(12).toString("hex")}`,
        processor,
      };
    } else {
      // Defer to Corepay SDK in a real implementation
      return { clientSecret: `tok_corepay_mock_${Date.now()}`, processor };
    }
  }
}
