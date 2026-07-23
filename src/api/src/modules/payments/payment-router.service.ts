import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import Stripe from "stripe";
import { PayoutProvider } from "../../common/interfaces/payout-provider.interface";
import { StripePayoutProvider } from "./stripe-payout.provider";
import { CorepayPayoutProvider } from "./corepay-payout.provider";

type StripeClient = InstanceType<typeof Stripe>;

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
  private readonly stripe: StripeClient | null;

  private readonly DISPUTE_RISK_THRESHOLD = 3;

  constructor(
    private readonly stripeProvider: StripePayoutProvider,
    private readonly corepayProvider: CorepayPayoutProvider,
  ) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = secretKey ? new Stripe(secretKey) : null;
  }

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

    this.logger.warn(
      `Using MOCK payment processor (${processor}) for user ${options.userId} in "${nodeEnv}" environment; ` +
        "no real charge will be created. This path is only valid for local development/testing.",
    );

    if (processor === "STRIPE") {
      if (mockFallbackAllowed) {
        return {
          clientSecret: `pi_stripe_mock_${Date.now()}_secret_${randomBytes(12).toString("hex")}`,
          processor,
        };
      }

      if (!this.stripe) {
        throw new ServiceUnavailableException("Stripe processor not configured for production");
      }

      const intent = await this.stripe.paymentIntents.create({
        amount: options.amount,
        currency: options.currency,
        metadata: {
          ...options.metadata,
          userId: options.userId,
        },
      }, {
        idempotencyKey: `pi-${options.userId}-${options.amount}-${options.currency}`,
      });

      if (!intent.client_secret) {
        throw new ServiceUnavailableException("Failed to retrieve client secret from Stripe");
      }

      return {
        clientSecret: intent.client_secret,
        processor,
      };
    } else {
      if (mockFallbackAllowed) {
        return { clientSecret: `tok_corepay_mock_${Date.now()}`, processor };
      }
      throw new ServiceUnavailableException("Corepay processor not configured for production");
    }
  }
}
