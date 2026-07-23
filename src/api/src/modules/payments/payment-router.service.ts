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
   * In dev/test, returns mock client secrets. In production, throws until
   * a real processor integration is configured.
   */
  async createPaymentIntent(
    options: PaymentIntentOptions,
    processor: PaymentProcessor,
  ): Promise<{ clientSecret: string; processor: PaymentProcessor }> {
    const isDev = process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "staging";

    if (processor === "STRIPE") {
      if (isDev) {
        return {
          clientSecret: `pi_stripe_mock_${Date.now()}_secret_${randomBytes(12).toString("hex")}`,
          processor,
        };
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
      if (!isDev) {
        throw new ServiceUnavailableException("Corepay processor not configured for production");
      }
      return { clientSecret: `tok_corepay_mock_${Date.now()}`, processor };
    }
  }
}
