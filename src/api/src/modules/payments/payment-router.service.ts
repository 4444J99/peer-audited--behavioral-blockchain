import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import Stripe from "stripe";

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

  
  private stripe: Stripe.Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    const isDev = process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "staging";
    if (!apiKey && !isDev) {
      throw new ServiceUnavailableException("Stripe processor not configured for production");
    }
    this.stripe = new Stripe(apiKey || "sk_test_mock_key", {
      apiVersion: "2026-05-27.dahlia" as any,
    });
  }
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

      if (!process.env.STRIPE_SECRET_KEY) {
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
