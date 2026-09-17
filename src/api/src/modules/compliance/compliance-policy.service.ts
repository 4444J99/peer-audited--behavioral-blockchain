import { Injectable, Logger, OnModuleInit, Optional } from "@nestjs/common";
import { Request } from "express";
import { readFileSync } from "fs";
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

/**
 * Which resolver produced the geo signal, in precedence order. The chain is a
 * configuration entry: adding a better source is adding a link, not a branch.
 */
export type GeoSource =
  | "cf-ipstate"
  | "cloudfront-viewer-country-region"
  | "x-styx-state"
  | "none";

/**
 * How the state (or the absence of one) was established. "ip-country-only" means
 * the chain resolved a country but no state — too coarse to pin a tier, precise
 * enough to admit read-only access for a permitted country.
 */
export type GeoStateSource =
  | "cf-ipstate"
  | "cloudfront-viewer-country-region"
  | "x-styx-state"
  | "ip-country-only"
  | "none";

/** One link in the ordered geo chain. */
export interface GeoResolution {
  country: string | null;
  region: string | null;
  source: GeoSource;
  confidence: number;
}

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
  country: string | null;
  source: GeoSource;
  stateSource: GeoStateSource;
  confidence: number;
  missingLocation: boolean;
  overrideIgnoredInProduction: boolean;
}

type ComplianceActionDecisionCore = Pick<
  ComplianceDecision,
  "allowed" | "code" | "message" | "requiredMode"
>;

const MINIMUM_AGE_YEARS = 18;

/**
 * Whether an unresolvable location is treated as FULL_ACCESS instead of blocked.
 *
 * Fail CLOSED by default everywhere (including production). A missing or
 * unparseable geo signal must never silently grant FULL_ACCESS — production must
 * not be more permissive than dev. Opening up requires an explicit opt-in.
 *
 * Exported so `StripeProductionGuard` can refuse to move live money while this is
 * on, rather than each caller re-deriving the parse and drifting.
 */
export function geofenceFailsOpenOnMissingLocation(): boolean {
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
