import { Injectable, Logger, OnModuleInit, Optional } from "@nestjs/common";
import { Request } from "express";
import * as geoip from "geoip-lite";
import { Pool } from "pg";
import {
  JurisdictionTier,
  STATE_TIERS,
  normalizeStateCode,
} from "../../../services/geofencing";
import { IdentityVerificationService } from "./identity-verification.service";

export type ComplianceMode = "FULL_ACCESS" | "REFUND_ONLY" | "BLOCKED";
export type ComplianceAction =
  | "CREATE_CONTRACT"
  | "FILE_DISPUTE"
  | "PURCHASE_TICKET"
  | "SUBMIT_PROOF"
  | "REQUEST_PROOF_UPLOAD_URL"
  | "CONFIRM_PROOF_UPLOAD"
  | "READ_ONLY"
  | "UNKNOWN";

export interface ComplianceDecision {
  allowed: boolean;
  code?:
    | "JURISDICTION_BLOCKED"
    | "JURISDICTION_REFUND_ONLY_RESTRICTED"
    | "KYC_REQUIRED"
    | "AGE_VERIFICATION_REQUIRED";
  message?: string;
  requiredMode: ComplianceMode;
  action: ComplianceAction;
  tier: JurisdictionTier;
  state: string | null;
  stateSource: "cf-ipstate" | "x-styx-state" | "ip-lookup" | "none";
  missingLocation: boolean;
  overrideIgnoredInProduction: boolean;
}

type ComplianceActionDecisionCore = Pick<
  ComplianceDecision,
  "allowed" | "code" | "message" | "requiredMode"
>;

const MINIMUM_AGE_YEARS = 18;

@Injectable()
export class CompliancePolicyService implements OnModuleInit {
  private readonly logger = new Logger(CompliancePolicyService.name);

  private static readonly RESTRICTED_REFUND_ONLY_ACTIONS =
    new Set<ComplianceAction>([
      "CREATE_CONTRACT",
      "FILE_DISPUTE",
      "PURCHASE_TICKET",
    ]);

  private static readonly KYC_GATED_ACTIONS = new Set<ComplianceAction>([
    "CREATE_CONTRACT",
    "FILE_DISPUTE",
    "PURCHASE_TICKET",
  ]);

  constructor(
    private readonly pool: Pool,
    @Optional()
    private readonly identityVerification?: IdentityVerificationService,
  ) {}

  /**
   * PRV16: KYC enforcement fails CLOSED in production — it is ON by default and is
   * only disabled by an explicit KYC_ENFORCEMENT_ENABLED=false. Outside production
   * it is opt-in (default off) so local/dev/test flows are not blocked. Whenever it
   * ends up disabled the state is logged LOUDLY so it is a deliberate, visible choice.
   * Note: the age gate (>=18) is enforced unconditionally regardless of this toggle.
   */
  onModuleInit(): void {
    if (this.isKycEnforcementEnabled()) return;

    const message =
      "KYC enforcement is DISABLED. Contracts above the TIER_1 ($20) micro-stake " +
      "threshold can be created WITHOUT identity verification. The unconditional age " +
      "gate (>=18) still applies.";

    // In production the default is ON, so a disabled state can only mean someone set
    // KYC_ENFORCEMENT_ENABLED=false explicitly — that is a dangerous, deliberate
    // compliance decision and must be an error-level signal.
    if (process.env.NODE_ENV === "production") {
      this.logger.error(
        `${message} PRODUCTION has KYC_ENFORCEMENT_ENABLED=false — confirm this is an intentional, compliant decision.`,
      );
    } else {
      this.logger.warn(
        `${message} (KYC is default-ON in production; set KYC_ENFORCEMENT_ENABLED=true to enforce here.)`,
      );
    }
  }

  async getJurisdictionPolicy(
    code: string,
  ): Promise<{ tier: JurisdictionTier; dispositionMode: string } | null> {
    const result = await this.pool.query(
      "SELECT tier, disposition_mode FROM jurisdictions WHERE code = $1",
      [code.toUpperCase()],
    );
    if (result.rows.length === 0) return null;
    return {
      tier: result.rows[0].tier as JurisdictionTier,
      dispositionMode: result.rows[0].disposition_mode,
    };
  }

  isKycEnforcementEnabled(): boolean {
    const flag = String(
      process.env.KYC_ENFORCEMENT_ENABLED ?? "",
    ).toLowerCase();
    if (process.env.NODE_ENV === "production") {
      // Fail closed in production: enforce KYC unless EXPLICITLY disabled.
      return flag !== "false";
    }
    // Non-production: opt-in so dev/test/local flows are not blocked by default.
    return flag === "true";
  }

  isAgeEnforcementImplemented(): boolean {
    return true;
  }

  /**
   * Real age gate (>=18). Reads the user's stored date_of_birth (captured at
   * registration) and computes whole years. Fails CLOSED: if the DOB is missing or
   * unparseable we treat the user as not age-verified and block the monetized action.
   */
  async evaluateAgeRequirement(
    userId: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const result = await this.pool.query(
      "SELECT date_of_birth FROM users WHERE id = $1",
      [userId],
    );

    const dobRaw = result.rows[0]?.date_of_birth ?? null;
    const age = this.computeAgeYears(dobRaw);

    if (age == null) {
      // Missing / unparseable DOB -> fail closed.
      return {
        allowed: false,
        reason:
          "Date of birth is required to verify you meet the minimum age requirement.",
      };
    }

    if (age < MINIMUM_AGE_YEARS) {
      return {
        allowed: false,
        reason: `You must be at least ${MINIMUM_AGE_YEARS} years old to perform this action.`,
      };
    }

    return { allowed: true };
  }

  private computeAgeYears(dob: unknown): number | null {
    if (dob == null) return null;
    const birth = dob instanceof Date ? dob : new Date(String(dob));
    if (isNaN(birth.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    // Subtract a year if this year's birthday has not yet occurred.
    const beforeBirthday =
      now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
    if (beforeBirthday) age -= 1;
    return age;
  }

  /**
   * Phase Beta P0-003: KYC tier gating.
   * TIER_1 ($20 max) is always allowed without KYC.
   * Above TIER_1, if KYC enforcement is enabled, identity must be verified.
   */
  async evaluateKycRequirement(
    userId: string,
    stakeAmount: number,
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (!this.isKycEnforcementEnabled()) {
      return { allowed: true };
    }

    // TIER_1 micro-stakes ($20 max) are always exempt from KYC
    const TIER_1_MAX = 20;
    if (stakeAmount <= TIER_1_MAX) {
      return { allowed: true };
    }

    // Check user's identity verification status
    const compliance = this.identityVerification
      ? await this.identityVerification.getUserComplianceStatus(userId)
      : null;

    if (!compliance?.isKycVerified) {
      return {
        allowed: false,
        reason: `Identity verification required for stakes above $${TIER_1_MAX}. Complete KYC to continue.`,
      };
    }

    return { allowed: true };
  }

  shouldFailOpenOnMissingLocation(): boolean {
    // Fail CLOSED by default everywhere (including production). A missing/unparseable
    // geo signal must never silently grant FULL_ACCESS — production must not be more
    // permissive than dev. Opening up requires an explicit, deliberate opt-in.
    const explicitAction = String(process.env.GEO_MISSING_HEADER_ACTION || "")
      .trim()
      .toLowerCase();
    if (explicitAction) {
      return (
        explicitAction === "allow" ||
        explicitAction === "open" ||
        explicitAction === "true"
      );
    }

    const raw = process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS;
    if (raw == null) return false; // fail-closed by default (Phase Beta P0-004)
    return String(raw).toLowerCase() === "true";
  }

  canCreateContract(input: {
    tier: JurisdictionTier;
    state: string | null;
  }): ComplianceActionDecisionCore {
    return this.evaluateActionPolicy(
      "CREATE_CONTRACT",
      input.tier,
      input.state,
    );
  }

  canSubmitProof(input: {
    tier: JurisdictionTier;
    state: string | null;
  }): ComplianceActionDecisionCore {
    return this.evaluateActionPolicy("SUBMIT_PROOF", input.tier, input.state);
  }

  canPurchaseTicket(input: {
    tier: JurisdictionTier;
    state: string | null;
  }): ComplianceActionDecisionCore {
    return this.evaluateActionPolicy(
      "PURCHASE_TICKET",
      input.tier,
      input.state,
    );
  }

  getEligibility(req: Request) {
    const location = this.resolveStateFromRequest(req);
    const tier = location.state
      ? (STATE_TIERS[location.state] ?? JurisdictionTier.TIER_3)
      : this.shouldFailOpenOnMissingLocation()
        ? JurisdictionTier.TIER_1
        : JurisdictionTier.TIER_3;

    const create = this.canCreateContract({ tier, state: location.state });
    const proof = this.canSubmitProof({ tier, state: location.state });
    const ticket = this.canPurchaseTicket({ tier, state: location.state });

    const requiredMode: ComplianceMode =
      tier === JurisdictionTier.TIER_3
        ? "BLOCKED"
        : tier === JurisdictionTier.TIER_2
          ? "REFUND_ONLY"
          : "FULL_ACCESS";

    return {
      requiredMode,
      jurisdiction: {
        state: location.state,
        tier,
        source: location.source,
        missing: !location.state,
      },
      controls: {
        kycEnforcementEnabled: this.isKycEnforcementEnabled(),
        ageEnforcementImplemented: this.isAgeEnforcementImplemented(),
      },
      actions: {
        canCreateContract: create.allowed,
        canSubmitProof: proof.allowed,
        canPurchaseTicket: ticket.allowed,
      },
    };
  }

  /**
   * Log a compliance decision to the audit trail.
   * Fire-and-forget — logging failures must never block the request.
   */
  private async logDecision(
    userId: string | null,
    action: ComplianceAction,
    decision: ComplianceDecision,
  ): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO compliance_decisions (user_id, action, jurisdiction_code, tier, allowed, reason_code, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          action,
          decision.state,
          decision.tier,
          decision.allowed,
          decision.code ?? null,
          JSON.stringify({
            stateSource: decision.stateSource,
            missingLocation: decision.missingLocation,
            requiredMode: decision.requiredMode,
          }),
        ],
      );
    } catch (err) {
      this.logger.error("Failed to log compliance decision", err);
    }
  }

  async evaluateUserComplianceForRequest(
    req: Request,
    userId: string,
  ): Promise<ComplianceActionDecisionCore> {
    const baseDecision = this.evaluateRequestPolicy(req);
    if (!baseDecision.allowed) {
      return {
        allowed: baseDecision.allowed,
        code: baseDecision.code,
        message: baseDecision.message,
        requiredMode: baseDecision.requiredMode,
      };
    }

    if (baseDecision.state) {
      await this.pool.query(
        "UPDATE users SET last_known_state = $1 WHERE id = $2",
        [baseDecision.state, userId],
      );
    }

    // Age gate applies to every monetized/real-money action and is enforced
    // unconditionally (it is a hard legal requirement, independent of the KYC
    // enforcement toggle). Fails closed when DOB is missing/under-age.
    if (CompliancePolicyService.KYC_GATED_ACTIONS.has(baseDecision.action)) {
      const age = await this.evaluateAgeRequirement(userId);
      if (!age.allowed) {
        return {
          allowed: false,
          code: "AGE_VERIFICATION_REQUIRED",
          message:
            age.reason ??
            "Age verification is required before performing this monetized action.",
          requiredMode: baseDecision.requiredMode,
        };
      }
    }

    if (
      !this.isKycEnforcementEnabled() ||
      !CompliancePolicyService.KYC_GATED_ACTIONS.has(baseDecision.action)
    ) {
      return {
        allowed: true,
        requiredMode: baseDecision.requiredMode,
      };
    }

    const compliance = this.identityVerification
      ? await this.identityVerification.getUserComplianceStatus(userId)
      : null;

    if (!compliance?.isKycVerified) {
      const decision: ComplianceDecision = {
        ...baseDecision,
        allowed: false,
        code: "KYC_REQUIRED",
        message:
          "Identity verification is required before performing this monetized action.",
        requiredMode: baseDecision.requiredMode,
      };
      await this.logDecision(userId, baseDecision.action, decision);
      return {
        allowed: false,
        code: "KYC_REQUIRED",
        message: decision.message,
        requiredMode: baseDecision.requiredMode,
      };
    }

    const allowedDecision: ComplianceDecision = {
      ...baseDecision,
      allowed: true,
      requiredMode: baseDecision.requiredMode,
    };
    await this.logDecision(userId, baseDecision.action, allowedDecision);
    return {
      allowed: true,
      requiredMode: baseDecision.requiredMode,
    };
  }

  evaluateRequestPolicy(req: Request): ComplianceDecision {
    const location = this.resolveStateFromRequest(req);
    const state = location.state;
    const tier = state
      ? (STATE_TIERS[state] ?? JurisdictionTier.TIER_3)
      : this.shouldFailOpenOnMissingLocation()
        ? JurisdictionTier.TIER_1
        : JurisdictionTier.TIER_3;
    const action = this.resolveActionFromRequest(req);

    if (!state && !this.shouldFailOpenOnMissingLocation()) {
      return {
        allowed: false,
        code: "JURISDICTION_BLOCKED",
        message: "Location verification is required to access this endpoint.",
        requiredMode: "BLOCKED",
        action,
        tier,
        state: null,
        stateSource: location.source,
        missingLocation: true,
        overrideIgnoredInProduction: location.overrideIgnoredInProduction,
      };
    }

    const base = this.evaluateActionPolicy(action, tier, state);
    return {
      ...base,
      action,
      tier,
      state,
      stateSource: location.source,
      missingLocation: !state,
      overrideIgnoredInProduction: location.overrideIgnoredInProduction,
    };
  }

  private evaluateActionPolicy(
    action: ComplianceAction,
    tier: JurisdictionTier,
    state: string | null,
  ): ComplianceActionDecisionCore {
    if (tier === JurisdictionTier.TIER_3) {
      return {
        allowed: false,
        code: "JURISDICTION_BLOCKED",
        message:
          "Styx Protocol is legally restricted in your jurisdiction. Geofencing enforcement active.",
        requiredMode: "BLOCKED",
      };
    }

    if (
      tier === JurisdictionTier.TIER_2 &&
      CompliancePolicyService.RESTRICTED_REFUND_ONLY_ACTIONS.has(action)
    ) {
      return {
        allowed: false,
        code: "JURISDICTION_REFUND_ONLY_RESTRICTED",
        message: `This action is unavailable in your jurisdiction while Styx is operating in refund-only mode${state ? ` (${state})` : ""}.`,
        requiredMode: "REFUND_ONLY",
      };
    }

    return {
      allowed: true,
      requiredMode:
        tier === JurisdictionTier.TIER_2 ? "REFUND_ONLY" : "FULL_ACCESS",
    };
  }

  /**
   * Whether request-borne proxy/CDN headers (cf-ipstate, cf-connecting-ip,
   * x-forwarded-for, x-real-ip) may be trusted. These are only meaningful when the
   * API actually sits behind a trusted proxy/CF edge that overwrites client-supplied
   * values. A raw client can forge any of them, so trust is gated behind an explicit
   * opt-in (default OFF / fail-closed).
   */
  private trustProxyHeaders(): boolean {
    return (
      String(process.env.TRUST_PROXY_HEADERS || "false")
        .trim()
        .toLowerCase() === "true"
    );
  }

  private resolveStateFromRequest(req: Request): {
    state: string | null;
    source: "cf-ipstate" | "x-styx-state" | "ip-lookup" | "none";
    overrideIgnoredInProduction: boolean;
  } {
    const trustProxy = this.trustProxyHeaders();

    // cf-ipstate is the Cloudflare-injected geo signal. It is only authoritative when
    // we are actually behind Cloudflare (TRUST_PROXY_HEADERS=true); otherwise a client
    // could spoof it to bypass a PROHIBITED jurisdiction block.
    if (trustProxy) {
      const cfIpState = normalizeStateCode(
        this.toSingleHeaderValue(req.headers["cf-ipstate"]),
      );
      if (cfIpState) {
        return {
          state: cfIpState,
          source: "cf-ipstate",
          overrideIgnoredInProduction: false,
        };
      }
    }

    const override = normalizeStateCode(
      this.toSingleHeaderValue(req.headers["x-styx-state"]),
    );
    const isProduction = process.env.NODE_ENV === "production";
    if (override && !isProduction) {
      return {
        state: override,
        source: "x-styx-state",
        overrideIgnoredInProduction: false,
      };
    }

    const ipState = this.lookupStateFromRequestIp(req, trustProxy);
    if (ipState) {
      return {
        state: ipState,
        source: "ip-lookup",
        overrideIgnoredInProduction: !!override && isProduction,
      };
    }

    return {
      state: null,
      source: "none",
      overrideIgnoredInProduction: !!override && isProduction,
    };
  }

  private resolveActionFromRequest(req: Request): ComplianceAction {
    const method = String(req.method || "GET").toUpperCase();
    const path = String(req.originalUrl || req.url || "");

    if (method === "POST" && /^\/contracts\/?$/.test(path))
      return "CREATE_CONTRACT";
    if (method === "POST" && /^\/contracts\/[^/]+\/dispute\/?$/.test(path))
      return "FILE_DISPUTE";
    if (method === "POST" && /^\/contracts\/[^/]+\/ticket\/?$/.test(path))
      return "PURCHASE_TICKET";
    if (method === "POST" && /^\/contracts\/[^/]+\/proof\/?$/.test(path))
      return "SUBMIT_PROOF";
    if (method === "POST" && /^\/proofs\/upload-url\/?$/.test(path))
      return "REQUEST_PROOF_UPLOAD_URL";
    if (method === "POST" && /^\/proofs\/[^/]+\/confirm-upload\/?$/.test(path))
      return "CONFIRM_PROOF_UPLOAD";
    if (method === "GET" || method === "HEAD") return "READ_ONLY";
    return "UNKNOWN";
  }

  private toSingleHeaderValue(
    value: string | string[] | undefined,
  ): string | null {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] ?? null;
    return value;
  }

  private lookupStateFromRequestIp(
    req: Request,
    trustProxy: boolean,
  ): string | null {
    const ip = this.extractClientIp(req, trustProxy);
    if (!ip) return null;

    const geo = geoip.lookup(ip);
    if (!geo || geo.country !== "US" || !geo.region) {
      return null;
    }

    return normalizeStateCode(geo.region);
  }

  /**
   * Resolve the client IP for geo lookup.
   * Forwarded headers (cf-connecting-ip, x-forwarded-for, x-real-ip) are spoofable by
   * any client and are only consulted when TRUST_PROXY_HEADERS=true (i.e. we sit behind
   * a trusted proxy that overwrites them). Otherwise we use the server-observed socket
   * address, which a client cannot forge.
   */
  private extractClientIp(req: Request, trustProxy: boolean): string | null {
    const socketIp =
      req.socket?.remoteAddress ||
      (req.connection as { remoteAddress?: string } | undefined)
        ?.remoteAddress ||
      null;

    let candidate: string | null = null;
    if (trustProxy) {
      const forwardedFor = this.toSingleHeaderValue(
        req.headers["x-forwarded-for"],
      );
      candidate =
        this.toSingleHeaderValue(req.headers["cf-connecting-ip"]) ||
        forwardedFor?.split(",")[0]?.trim() ||
        this.toSingleHeaderValue(req.headers["x-real-ip"]) ||
        req.ip ||
        socketIp ||
        null;
    } else {
      // Do not trust client-supplied forwarding headers; rely on the server-observed peer.
      candidate = socketIp || null;
    }

    if (!candidate) return null;
    return candidate.replace(/^::ffff:/, "").trim() || null;
  }
}
