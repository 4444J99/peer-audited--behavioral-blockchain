import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import Stripe from "stripe";
import { PayoutProvider } from "../../common/interfaces/payout-provider.interface";
import { StripePayoutProvider } from "./stripe-payout.provider";
import { CorepayPayoutProvider } from "./corepay-payout.provider";
import { STATE_TIERS, JurisdictionTier } from "../../../services/geofencing";

type StripeClient = InstanceType<typeof Stripe>;

export type PaymentProcessor =
  | "STRIPE"
  | "HIGH_RISK_COREPAY"
  | "STABLECOIN_VAULT";

export interface PaymentIntentOptions {
  amount: number;
  currency: string;
  userId: string;
  metadata?: Record<string, string>;
  isHighRisk?: boolean;
}

export interface GeographicPaymentContext {
  country?: string | null;
  state?: string | null;
  ip?: string | null;
  source?: string;
  preferredRail?: "FIAT" | "CRYPTO";
}

export interface PaymentRoutingDecision {
  processor: PaymentProcessor;
  jurisdictionTier: JurisdictionTier;
  scaRequired: boolean;
  refundOnly: boolean;
  feeStructure: {
    percentageFee: number;
    fixedFeeCents: number;
    currency: string;
    description: string;
  };
  reason: string;
  fallbackProcessor?: PaymentProcessor;
}

export interface GeographicRoutingMetrics {
  totalDecisions: number;
  routedStripe: number;
  routedCorepay: number;
  routedStablecoin: number;
  blockedJurisdictions: number;
  byJurisdiction: Record<string, number>;
}

const EU_SCA_COUNTRIES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR",
  "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK", "GB"
]);

@Injectable()
export class PaymentRouterService {
  private readonly logger = new Logger(PaymentRouterService.name);
  private readonly stripe: StripeClient | null;

  private readonly DISPUTE_RISK_THRESHOLD = 3;

  private readonly metrics: GeographicRoutingMetrics = {
    totalDecisions: 0,
    routedStripe: 0,
    routedCorepay: 0,
    routedStablecoin: 0,
    blockedJurisdictions: 0,
    byJurisdiction: {},
  };

  constructor(
    private readonly stripeProvider: StripePayoutProvider,
    private readonly corepayProvider: CorepayPayoutProvider,
  ) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = secretKey ? new Stripe(secretKey) : null;
  }

  /**
   * Evaluates user jurisdiction and risk context to produce an authoritative
   * payment routing decision (Issue #85).
   */
  determineGeographicRoute(
    options: PaymentIntentOptions,
    geoContext: GeographicPaymentContext,
    userTotalDisputes = 0,
  ): PaymentRoutingDecision {
    this.metrics.totalDecisions++;

    const country = (geoContext.country || "US").toUpperCase();
    const state = geoContext.state ? geoContext.state.toUpperCase() : null;
    const jurisdictionKey = state ? `${country}-${state}` : country;
    this.metrics.byJurisdiction[jurisdictionKey] =
      (this.metrics.byJurisdiction[jurisdictionKey] || 0) + 1;

    let tier: JurisdictionTier = JurisdictionTier.TIER_1;
    let isHardBlocked = false;
    let isRefundOnly = false;

    if (country === "US") {
      if (state && STATE_TIERS[state]) {
        tier = STATE_TIERS[state];
      } else {
        // Unknown or unclassified US state fails closed to TIER_3 per Aegis CG-06 / SH7
        tier = state ? STATE_TIERS[state] || JurisdictionTier.TIER_3 : JurisdictionTier.TIER_1;
      }

      if (tier === JurisdictionTier.TIER_3) {
        isHardBlocked = true;
      } else if (tier === JurisdictionTier.TIER_2) {
        isRefundOnly = true;
      }
    }

    if (isHardBlocked) {
      this.metrics.blockedJurisdictions++;
      this.logger.warn(
        `Payment attempt blocked: User ${options.userId} in hard-blocked jurisdiction (${jurisdictionKey})`,
      );
      throw new ForbiddenException(
        `Paid contract settlement is prohibited in jurisdiction: ${jurisdictionKey} (TIER_3 Hard Block)`,
      );
    }

    const scaRequired = EU_SCA_COUNTRIES.has(country);

    // Crypto / Stablecoin preference routing
    if (
      geoContext.preferredRail === "CRYPTO" ||
      options.currency.toLowerCase() === "usdc"
    ) {
      this.metrics.routedStablecoin++;
      return {
        processor: "STABLECOIN_VAULT",
        jurisdictionTier: tier,
        scaRequired: false,
        refundOnly: isRefundOnly,
        feeStructure: {
          percentageFee: 0.5,
          fixedFeeCents: 0,
          currency: options.currency,
          description: "Stablecoin settlement fee (0.5% flat)",
        },
        reason: "User selected stablecoin rail or USDC currency",
      };
    }

    // High dispute or explicit high risk routing
    if (
      options.isHighRisk ||
      userTotalDisputes >= this.DISPUTE_RISK_THRESHOLD
    ) {
      this.metrics.routedCorepay++;
      this.logger.warn(
        `Routing transaction for user ${options.userId} to HIGH-RISK processor (${jurisdictionKey}, Disputes: ${userTotalDisputes})`,
      );
      return {
        processor: "HIGH_RISK_COREPAY",
        jurisdictionTier: tier,
        scaRequired,
        refundOnly: isRefundOnly,
        fallbackProcessor: "STRIPE",
        feeStructure: {
          percentageFee: 7.5,
          fixedFeeCents: 50,
          currency: options.currency,
          description: "High-risk merchant rate (7.5% + $0.50)",
        },
        reason: `High risk profile: ${userTotalDisputes} previous disputes or explicit contest flag`,
      };
    }

    // Standard Stripe processing
    this.metrics.routedStripe++;
    return {
      processor: "STRIPE",
      jurisdictionTier: tier,
      scaRequired,
      refundOnly: isRefundOnly,
      fallbackProcessor: "HIGH_RISK_COREPAY",
      feeStructure: {
        percentageFee: scaRequired ? 1.4 : 2.9,
        fixedFeeCents: scaRequired ? 25 : 30,
        currency: options.currency,
        description: scaRequired
          ? "European Economic Area interchange (1.4% + €0.25) with mandatory SCA"
          : isRefundOnly
            ? "Standard US card processing with refund-only constraint (2.9% + $0.30)"
            : "Standard US card processing (2.9% + $0.30)",
      },
      reason: isRefundOnly
        ? `Permitted under refund-only rules in ${jurisdictionKey}`
        : `Standard routing for ${jurisdictionKey}`,
    };
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

  getRoutingMetrics(): GeographicRoutingMetrics {
    return { ...this.metrics };
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
    } else if (processor === "HIGH_RISK_COREPAY") {
      if (mockFallbackAllowed) {
        return { clientSecret: `tok_corepay_mock_${Date.now()}`, processor };
      }
      throw new ServiceUnavailableException("Corepay processor not configured for production");
    } else {
      if (mockFallbackAllowed) {
        return { clientSecret: `vault_usdc_mock_${Date.now()}`, processor };
      }
      throw new ServiceUnavailableException("Stablecoin vault processor not configured for production");
    }
  }
}
