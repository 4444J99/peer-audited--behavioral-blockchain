import { Injectable, Optional } from '@nestjs/common';
import { Request } from 'express';
import { Pool } from 'pg';
import { JurisdictionTier, STATE_TIERS } from '../../../services/geofencing';
import { IdentityVerificationService } from './identity-verification.service';

export type ComplianceMode = 'FULL_ACCESS' | 'REFUND_ONLY' | 'BLOCKED';
export type ComplianceAction =
  | 'CREATE_CONTRACT'
  | 'FILE_DISPUTE'
  | 'PURCHASE_TICKET'
  | 'SUBMIT_PROOF'
  | 'REQUEST_PROOF_UPLOAD_URL'
  | 'CONFIRM_PROOF_UPLOAD'
  | 'READ_ONLY'
  | 'UNKNOWN';

export interface ComplianceDecision {
  allowed: boolean;
  code?: 'JURISDICTION_BLOCKED' | 'JURISDICTION_REFUND_ONLY_RESTRICTED' | 'KYC_REQUIRED';
  message?: string;
  requiredMode: ComplianceMode;
  action: ComplianceAction;
  tier: JurisdictionTier;
  state: string | null;
  stateSource: 'cf-ipstate' | 'x-styx-state' | 'none';
  missingLocation: boolean;
  overrideIgnoredInProduction: boolean;
}

type ComplianceActionDecisionCore = Pick<ComplianceDecision, 'allowed' | 'code' | 'message' | 'requiredMode'>;

@Injectable()
export class CompliancePolicyService {
  private static readonly RESTRICTED_REFUND_ONLY_ACTIONS = new Set<ComplianceAction>([
    'CREATE_CONTRACT',
    'FILE_DISPUTE',
    'PURCHASE_TICKET',
  ]);

  private static readonly KYC_GATED_ACTIONS = new Set<ComplianceAction>([
    'CREATE_CONTRACT',
    'FILE_DISPUTE',
    'PURCHASE_TICKET',
  ]);

  constructor(
    private readonly pool: Pool,
    @Optional() private readonly identityVerification?: IdentityVerificationService,
  ) {}

  async getJurisdictionPolicy(code: string): Promise<{ tier: JurisdictionTier; dispositionMode: string } | null> {
    const result = await this.pool.query(
      'SELECT tier, disposition_mode FROM jurisdictions WHERE code = $1',
      [code.toUpperCase()]
    );
    if (result.rows.length === 0) return null;
    return {
      tier: result.rows[0].tier as JurisdictionTier,
      dispositionMode: result.rows[0].disposition_mode,
    };
  }

  isKycEnforcementEnabled(): boolean {
    return String(process.env.KYC_ENFORCEMENT_ENABLED || 'false').toLowerCase() === 'true';
  }

  isAgeEnforcementImplemented(): boolean {
    return true;
  }

  shouldFailOpenOnMissingLocation(): boolean {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) return false;

    const raw = process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS;
    if (raw == null) return true;
    return String(raw).toLowerCase() !== 'false';
  }

  canCreateContract(input: { tier: JurisdictionTier; state: string | null }): ComplianceActionDecisionCore {
    return this.evaluateActionPolicy('CREATE_CONTRACT', input.tier, input.state);
  }

  canSubmitProof(input: { tier: JurisdictionTier; state: string | null }): ComplianceActionDecisionCore {
    return this.evaluateActionPolicy('SUBMIT_PROOF', input.tier, input.state);
  }

  canPurchaseTicket(input: { tier: JurisdictionTier; state: string | null }): ComplianceActionDecisionCore {
    return this.evaluateActionPolicy('PURCHASE_TICKET', input.tier, input.state);
  }

  getEligibility(req: Request) {
    const location = this.resolveStateFromRequest(req);
    const tier = location.state ? (STATE_TIERS[location.state] ?? JurisdictionTier.TIER_1) : JurisdictionTier.TIER_1;

    const create = this.canCreateContract({ tier, state: location.state });
    const proof = this.canSubmitProof({ tier, state: location.state });
    const ticket = this.canPurchaseTicket({ tier, state: location.state });

    const requiredMode: ComplianceMode = tier === JurisdictionTier.TIER_3
      ? 'BLOCKED'
      : tier === JurisdictionTier.TIER_2
        ? 'REFUND_ONLY'
        : 'FULL_ACCESS';

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

  async evaluateUserComplianceForRequest(req: Request, userId: string): Promise<ComplianceActionDecisionCore> {
    const baseDecision = this.evaluateRequestPolicy(req);
    if (!baseDecision.allowed) {
      return {
        allowed: baseDecision.allowed,
        code: baseDecision.code,
        message: baseDecision.message,
        requiredMode: baseDecision.requiredMode,
      };
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
      return {
        allowed: false,
        code: 'KYC_REQUIRED',
        message: 'Identity verification is required before performing this monetized action.',
        requiredMode: baseDecision.requiredMode,
      };
    }

    return {
      allowed: true,
      requiredMode: baseDecision.requiredMode,
    };
  }

  evaluateRequestPolicy(req: Request): ComplianceDecision {
    const location = this.resolveStateFromRequest(req);
    const state = location.state;
    const tier = state ? (STATE_TIERS[state] ?? JurisdictionTier.TIER_1) : JurisdictionTier.TIER_1;
    const action = this.resolveActionFromRequest(req);

    if (!state && !this.shouldFailOpenOnMissingLocation()) {
      return {
        allowed: false,
        code: 'JURISDICTION_BLOCKED',
        message: 'Location verification is required to access this endpoint.',
        requiredMode: 'BLOCKED',
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
        code: 'JURISDICTION_BLOCKED',
        message: 'Styx Protocol is legally restricted in your jurisdiction. Geofencing enforcement active.',
        requiredMode: 'BLOCKED',
      };
    }

    if (tier === JurisdictionTier.TIER_2 && CompliancePolicyService.RESTRICTED_REFUND_ONLY_ACTIONS.has(action)) {
      return {
        allowed: false,
        code: 'JURISDICTION_REFUND_ONLY_RESTRICTED',
        message: `This action is unavailable in your jurisdiction while Styx is operating in refund-only mode${state ? ` (${state})` : ''}.`,
        requiredMode: 'REFUND_ONLY',
      };
    }

    return {
      allowed: true,
      requiredMode: tier === JurisdictionTier.TIER_2 ? 'REFUND_ONLY' : 'FULL_ACCESS',
    };
  }

  private resolveStateFromRequest(req: Request): {
    state: string | null;
    source: 'cf-ipstate' | 'x-styx-state' | 'none';
    overrideIgnoredInProduction: boolean;
  } {
    const cfIpState = this.toSingleHeaderValue(req.headers['cf-ipstate']);
    if (cfIpState) {
      return {
        state: cfIpState.toUpperCase(),
        source: 'cf-ipstate',
        overrideIgnoredInProduction: false,
      };
    }

    const override = this.toSingleHeaderValue(req.headers['x-styx-state']);
    const isProduction = process.env.NODE_ENV === 'production';
    if (override && !isProduction) {
      return {
        state: override.toUpperCase(),
        source: 'x-styx-state',
        overrideIgnoredInProduction: false,
      };
    }

    return {
      state: null,
      source: 'none',
      overrideIgnoredInProduction: !!override && isProduction,
    };
  }

  private resolveActionFromRequest(req: Request): ComplianceAction {
    const method = String(req.method || 'GET').toUpperCase();
    const path = String(req.originalUrl || req.url || '');

    if (method === 'POST' && /^\/contracts\/?$/.test(path)) return 'CREATE_CONTRACT';
    if (method === 'POST' && /^\/contracts\/[^/]+\/dispute\/?$/.test(path)) return 'FILE_DISPUTE';
    if (method === 'POST' && /^\/contracts\/[^/]+\/ticket\/?$/.test(path)) return 'PURCHASE_TICKET';
    if (method === 'POST' && /^\/contracts\/[^/]+\/proof\/?$/.test(path)) return 'SUBMIT_PROOF';
    if (method === 'POST' && /^\/proofs\/upload-url\/?$/.test(path)) return 'REQUEST_PROOF_UPLOAD_URL';
    if (method === 'POST' && /^\/proofs\/[^/]+\/confirm-upload\/?$/.test(path)) return 'CONFIRM_PROOF_UPLOAD';
    if (method === 'GET' || method === 'HEAD') return 'READ_ONLY';
    return 'UNKNOWN';
  }

  private toSingleHeaderValue(value: string | string[] | undefined): string | null {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] ?? null;
    return value;
  }
}
