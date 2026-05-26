import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Optional, Inject, Logger, InternalServerErrorException, forwardRef, ConflictException } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { JurisdictionTier } from '../../../services/geofencing';
import { StripeFBOService as RealStripeFBOService } from '../payments/stripe-fbo.service';
import { SettlementService } from '../payments/settlement.service';
import { buildSettlementQuote } from '../payments/settlement-quote';
import { DisputeService } from '../../../services/escrow/dispute.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { AegisProtocolService } from '../../../services/health/aegis.service';
import { RecoveryProtocolService } from '../../../services/health/recovery-protocol.service';
import { DynamicPenaltyService } from '../../../services/health/dynamic-penalty.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';

import { NotificationsService } from '../notifications/notifications.service';
import { CompliancePolicyService } from '../compliance/compliance-policy.service';
import { calculateIntegrity, getAllowedTiers, getTierMaxStake, UserHistory } from '../../../../shared/libs/integrity';
import {
  OathCategory,
  VerificationMethod,
  validateOathMapping,
  grantOnboardingBonus,
  useGraceDay,
  MAX_GRACE_DAYS_PER_MONTH,
  ONBOARDING_BONUS_AMOUNT,
  FAILURE_COOL_OFF_DAYS,
  DOWNSCALE_STRIKE_THRESHOLD,
  MAX_NOCONTACT_DURATION_DAYS,
} from '../../../../shared/libs/behavioral-logic';
import { getRealmForCategory, RealmId } from '../../../../shared/libs/realm-registry';

import {
  CreateContractDto as CreateContractDtoBase,
  SubmitProofDto as SubmitProofDtoBase,
  SubmitWhoopScoredDto as SubmitWhoopScoredDtoBase,
  CohortMode,
  PricingPlan,
  WhoopScoredState,
} from './dto';

export interface CreateContractInput extends CreateContractDtoBase {
  userId: string;
}

export interface SubmitProofInput extends SubmitProofDtoBase {
  userId: string;
}

export interface SubmitWhoopScoredInput extends SubmitWhoopScoredDtoBase {
  userId: string;
}

export interface ContractReadRequester {
  userId: string;
}

type ContractResolutionSideEffectType =
  | 'STRIPE_CANCEL_HOLD'
  | 'STRIPE_CAPTURE_STAKE'
  | 'STRIPE_CAPTURE_APPEAL_FEE'
  | 'STRIPE_CANCEL_APPEAL_FEE'
  | 'LEDGER_STAKE_RETURN'
  | 'LEDGER_STAKE_CAPTURE'
  | 'LEDGER_BOUNTY_POOL_TOPUP'
  | 'TRUTH_CONTRACT_RESOLVED'
  | 'NOTIFY_CONTRACT_RESOLVED';

interface ContractResolutionSideEffectRow {
  id: string;
  contract_id: string;
  outcome: string;
  effect_type: ContractResolutionSideEffectType;
  dedupe_key: string;
  payload: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'QUARANTINED';
  attempts: number;
  next_retry_at?: string | null;
  quarantined_at?: string | null;
  quarantine_reason?: string | null;
  locked_at?: string | null;
}

const DEFAULT_COHORT_MAX_MEMBERS = 50;
const DEFAULT_POD_MAX_MEMBERS = 5;
const MVP_39_TOTAL_USD = 39;
const MVP_39_PLATFORM_FEE_USD = 9;
const MVP_39_STAKE_USD = 30;

type PricingMetadata = {
  plan: PricingPlan;
  totalEntryUsd: number;
  platformFeeUsd: number;
  refundableStakeUsd: number;
};

import { toCents, toDollars } from '../../../../shared/libs/money';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);
  private static readonly CONTRACT_RESOLUTION_OUTBOX_MAX_ATTEMPTS = 8;
  private static readonly CONTRACT_RESOLUTION_OUTBOX_RETRY_BASE_MS = 5 * 60 * 1000;
  private static readonly CONTRACT_RESOLUTION_OUTBOX_RETRY_MAX_MS = 6 * 60 * 60 * 1000;

  constructor(
    private readonly pool: Pool,
    private readonly ledger: LedgerService,
    private readonly truthLog: TruthLogService,
    private readonly stripe: StripeFboService,
    private readonly realStripe: RealStripeFBOService,
    private readonly dispute: DisputeService,
    private readonly furyRouter: FuryRouterService,
    private readonly aegis: AegisProtocolService,
    private readonly recovery: RecoveryProtocolService,
    private readonly dynamicPenalty: DynamicPenaltyService,
    private readonly anomaly: AnomalyService,

    @Optional() @Inject(NotificationsService) private readonly notifications?: NotificationsService,
    @Optional() @Inject(CompliancePolicyService) private readonly compliancePolicy?: CompliancePolicyService,
    @Optional() @Inject(forwardRef(() => SettlementService)) private readonly settlementService?: SettlementService,
  ) {}

  private stakeAmountToCents(stakeAmount: number | string): number {
    return toCents(Number(stakeAmount));
  }

  private async assertCanReadContractRow(contractRow: any, requester: ContractReadRequester): Promise<void> {
    if (contractRow.user_id === requester.userId) {
      return;
    }

    const accessResult = await this.getRequesterAccessForOwner(contractRow.user_id, requester.userId);

    if (accessResult.rows.length === 0) {
      throw new ForbiddenException('Requester is not authorized to access this contract');
    }

    const access = accessResult.rows[0];
    const requesterRole = String(access.requester_role || 'USER').toUpperCase();

    if (requesterRole === 'ADMIN') {
      return;
    }

    const tenantAdminRoles = new Set(['ENTERPRISE_ADMIN', 'HR_ADMIN', 'TENANT_ADMIN']);
    const sameEnterprise =
      access.owner_enterprise_id &&
      access.requester_enterprise_id &&
      access.owner_enterprise_id === access.requester_enterprise_id;

    if (sameEnterprise && tenantAdminRoles.has(requesterRole)) {
      return;
    }

    throw new ForbiddenException('Cannot access another user\'s contract');
  }

  private async assertCanWriteContractRow(contractRow: any, requester: ContractReadRequester): Promise<void> {
    if (contractRow.user_id === requester.userId) {
      return;
    }

    const accessResult = await this.getRequesterAccessForOwner(contractRow.user_id, requester.userId);
    if (accessResult.rows.length === 0) {
      throw new ForbiddenException('Requester is not authorized to modify this contract');
    }

    const requesterRole = String(accessResult.rows[0].requester_role || 'USER').toUpperCase();
    if (requesterRole === 'ADMIN') {
      return;
    }

    throw new ForbiddenException('Cannot modify another user\'s contract');
  }

  private getRequesterAccessForOwner(ownerUserId: string, requesterUserId: string) {
    return this.pool.query(
      `SELECT
         owner.enterprise_id AS owner_enterprise_id,
         requester.role AS requester_role,
         requester.enterprise_id AS requester_enterprise_id
       FROM users owner
       JOIN users requester ON requester.id = $2
       WHERE owner.id = $1`,
      [ownerUserId, requesterUserId],
    );
  }

  private async enqueueContractResolutionSideEffects(
    db: { query: PoolClient['query'] },
    effects: Array<{
      contractId: string;
      outcome: 'COMPLETED' | 'FAILED';
      effectType: ContractResolutionSideEffectType;
      dedupeKey: string;
      payload: Record<string, any>;
    }>,
  ): Promise<void> {
    for (const effect of effects) {
      await db.query(
        `INSERT INTO contract_resolution_side_effects
           (contract_id, outcome, effect_type, dedupe_key, payload, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')
         ON CONFLICT (dedupe_key) DO NOTHING`,
        [
          effect.contractId,
          effect.outcome,
          effect.effectType,
          effect.dedupeKey,
          JSON.stringify(effect.payload),
        ],
      );
    }
  }

  private buildContractResolutionSideEffects(input: {
    contractId: string;
    outcome: 'COMPLETED' | 'FAILED';
    contractRow: any;
    userRow: any;
    escrowAccountId: string | null;
    revenueAccountId: string | null;
    bountyPoolAccountId?: string | null;
    jurisdictionTier?: import('../../../services/geofencing').JurisdictionTier;
  }): Array<{
    contractId: string;
    outcome: 'COMPLETED' | 'FAILED';
    effectType: ContractResolutionSideEffectType;
    dedupeKey: string;
    payload: Record<string, any>;
  }> {
    const {
      contractId,
      outcome,
      contractRow,
      userRow,
      escrowAccountId,
      revenueAccountId,
      bountyPoolAccountId,
      jurisdictionTier,
    } = input;
    const effects: Array<{
      contractId: string;
      outcome: 'COMPLETED' | 'FAILED';
      effectType: ContractResolutionSideEffectType;
      dedupeKey: string;
      payload: Record<string, any>;
    }> = [];
    const baseKey = `contract-resolution:${contractId}:${outcome}`;

    // Phase Beta P0-011: Resolve disposition via escrow service
    const disposition = jurisdictionTier
      ? this.stripe.resolveDisposition(outcome, jurisdictionTier)
      : (outcome === 'COMPLETED' ? 'REFUND' as const : 'CAPTURE' as const);
    const amountCents = this.stakeAmountToCents(contractRow.stake_amount);
    const quote = buildSettlementQuote(
      amountCents,
      outcome === 'COMPLETED' ? 'PASS' : 'FAIL',
      disposition,
    );

    // For REFUND disposition on failure, cancel the hold instead of capturing.
    const stripeEffect = disposition === 'REFUND'
      ? 'STRIPE_CANCEL_HOLD' as const
      : 'STRIPE_CAPTURE_STAKE' as const;

    if (contractRow.payment_intent_id) {
      effects.push({
        contractId,
        outcome,
        effectType: stripeEffect,
        dedupeKey: `${baseKey}:stripe`,
        payload: {
          paymentIntentId: contractRow.payment_intent_id,
        },
      });
    }

    // Double-down adds extra Stripe holds recorded in metadata.additional_payouts.
    // These must be captured/cancelled at settlement alongside the primary intent;
    // otherwise the additional authorizations are orphaned. We emit one Stripe
    // effect per additional intent so the outbox dispatcher acts on each.
    const additionalIntents = Array.isArray(contractRow?.metadata?.additional_payouts)
      ? contractRow.metadata.additional_payouts
      : [];
    const seenIntents = new Set<string>(
      contractRow.payment_intent_id ? [contractRow.payment_intent_id] : [],
    );
    for (const intentId of additionalIntents) {
      if (typeof intentId !== 'string' || !intentId || seenIntents.has(intentId)) {
        continue;
      }
      seenIntents.add(intentId);
      effects.push({
        contractId,
        outcome,
        effectType: stripeEffect,
        dedupeKey: `${baseKey}:stripe:additional:${intentId}`,
        payload: {
          paymentIntentId: intentId,
        },
      });
    }

    if (userRow?.account_id && escrowAccountId) {
      if (quote.actualAction === 'RELEASE') {
        // Return stake to user (success, or TIER_2 refund-only failure)
        const isRefundOnly = outcome === 'FAILED';
        effects.push({
          contractId,
          outcome,
          effectType: 'LEDGER_STAKE_RETURN',
          dedupeKey: `${baseKey}:ledger:return`,
          payload: {
            debitAccountId: escrowAccountId,
            creditAccountId: userRow.account_id,
            amount: amountCents,
            metadata: {
              type: isRefundOnly ? 'REFUND_ONLY_DISPOSITION' : 'STAKE_RETURN',
              outcome,
              jurisdictionTier: jurisdictionTier || null,
              sideEffectKey: `${baseKey}:ledger:return`,
            },
          },
        });
      } else if (revenueAccountId) {
        // Capture stake as platform revenue (TIER_1 failure)
        effects.push({
          contractId,
          outcome,
          effectType: 'LEDGER_STAKE_CAPTURE',
          dedupeKey: `${baseKey}:ledger:capture`,
          payload: {
            debitAccountId: escrowAccountId,
            creditAccountId: revenueAccountId,
            amount: amountCents,
            metadata: {
              type: 'STAKE_CAPTURED',
              outcome,
              platformFeeCents: quote.platformFeeCents,
              bountyPoolCents: quote.bountyPoolCents,
              sideEffectKey: `${baseKey}:ledger:capture`,
            },
          },
        });

        if (quote.bountyPoolCents > 0 && bountyPoolAccountId) {
          effects.push({
            contractId,
            outcome,
            effectType: 'LEDGER_BOUNTY_POOL_TOPUP',
            dedupeKey: `${baseKey}:ledger:bounty-topup`,
            payload: {
              debitAccountId: revenueAccountId,
              creditAccountId: bountyPoolAccountId,
              amount: quote.bountyPoolCents,
              metadata: {
                type: 'BOUNTY_POOL_TOPUP',
                outcome,
                sideEffectKey: `${baseKey}:ledger:bounty-topup`,
              },
            },
          });
        }
      }
    }

    effects.push({
      contractId,
      outcome,
      effectType: 'TRUTH_CONTRACT_RESOLVED',
      dedupeKey: `${baseKey}:truthlog`,
      payload: {
        eventType: 'CONTRACT_RESOLVED',
        payload: {
          contractId,
          outcome,
          userId: contractRow.user_id,
          stakeAmount: Number(contractRow.stake_amount),
          sideEffectKey: `${baseKey}:truthlog`,
        },
      },
    });

    effects.push({
      contractId,
      outcome,
      effectType: 'NOTIFY_CONTRACT_RESOLVED',
      dedupeKey: `${baseKey}:notification`,
      payload: {
        userId: contractRow.user_id,
        type: 'CONTRACT_RESOLVED',
        title: outcome === 'COMPLETED' ? 'Contract Completed' : 'Contract Failed',
        body: outcome === 'COMPLETED'
          ? `Your contract has been fulfilled. $${Number(contractRow.stake_amount).toFixed(2)} returned.`
          : quote.actualAction === 'RELEASE'
            ? `Your contract has failed, but $${Number(contractRow.stake_amount).toFixed(2)} was returned under the jurisdictional refund rule.`
            : `Your contract has failed. $${Number(contractRow.stake_amount).toFixed(2)} has been captured.`,
        metadata: {
          contractId,
          outcome,
          actualAction: quote.actualAction,
          sideEffectKey: `${baseKey}:notification`,
        },
      },
    });

    return effects;
  }

  private async drainContractResolutionSideEffects(
    contractId: string,
    outcome: string,
  ): Promise<void> {
    const pending = await this.pool.query(
      `SELECT id, contract_id, outcome, effect_type, dedupe_key, payload, status, attempts,
              next_retry_at, quarantined_at, quarantine_reason, locked_at
       FROM contract_resolution_side_effects
       WHERE contract_id = $1
         AND outcome = $2
         AND (
           status = 'PENDING'
           OR (status = 'FAILED' AND (next_retry_at IS NULL OR next_retry_at <= NOW()))
         )
       ORDER BY created_at ASC`,
      [contractId, outcome],
    );

    for (const row of pending.rows as ContractResolutionSideEffectRow[]) {
      const claimed = await this.pool.query(
        `UPDATE contract_resolution_side_effects
         SET status = 'PROCESSING',
             attempts = attempts + 1,
             locked_at = NOW(),
             next_retry_at = NULL,
             last_error = NULL
         WHERE id = $1
           AND (
             status = 'PENDING'
             OR (status = 'FAILED' AND (next_retry_at IS NULL OR next_retry_at <= NOW()))
           )
         RETURNING id, contract_id, outcome, effect_type, dedupe_key, payload, status, attempts,
                   next_retry_at, quarantined_at, quarantine_reason, locked_at`,
        [row.id],
      );

      if (claimed.rows.length === 0) {
        continue;
      }

      const effect = claimed.rows[0] as ContractResolutionSideEffectRow;
      try {
        await this.dispatchContractResolutionSideEffect(effect);
        await this.pool.query(
          `UPDATE contract_resolution_side_effects
           SET status = 'COMPLETED',
               processed_at = NOW(),
               last_error = NULL,
               locked_at = NULL,
               next_retry_at = NULL
           WHERE id = $1`,
          [effect.id],
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const sanitizedError = message.slice(0, 2000);
        const shouldQuarantine =
          effect.attempts >= ContractsService.CONTRACT_RESOLUTION_OUTBOX_MAX_ATTEMPTS;

        if (shouldQuarantine) {
          await this.pool.query(
            `UPDATE contract_resolution_side_effects
             SET status = 'QUARANTINED',
                 last_error = $2,
                 locked_at = NULL,
                 next_retry_at = NULL,
                 quarantined_at = NOW(),
                 quarantine_reason = $3
             WHERE id = $1`,
            [
              effect.id,
              sanitizedError,
              `Exceeded max retry attempts (${ContractsService.CONTRACT_RESOLUTION_OUTBOX_MAX_ATTEMPTS})`,
            ],
          );
          this.logger.error(
            `Quarantined contract settlement outbox effect ${effect.id} (${effect.effect_type}) for contract ${effect.contract_id} after ${effect.attempts} attempts: ${sanitizedError}`,
          );
        } else {
          const retryDelayMs = this.getContractResolutionOutboxRetryDelayMs(effect.attempts);
          await this.pool.query(
            `UPDATE contract_resolution_side_effects
             SET status = 'FAILED',
                 last_error = $2,
                 locked_at = NULL,
                 next_retry_at = NOW() + ($3::bigint * INTERVAL '1 millisecond'),
                 quarantined_at = NULL,
                 quarantine_reason = NULL
             WHERE id = $1`,
            [effect.id, sanitizedError, retryDelayMs],
          );
        }
        throw err;
      }
    }
  }

  async sweepFailedContractResolutionSideEffects(limit = 25): Promise<{
    staleResetCount: number;
    staleQuarantinedCount: number;
    groupsFound: number;
    groupsRetried: number;
    groupsFailed: number;
    quarantinedTotalCount: number;
  }> {
    const staleResetResult = await this.pool.query(
      `UPDATE contract_resolution_side_effects
       SET status = CASE
             WHEN attempts >= $1 THEN 'QUARANTINED'
             ELSE 'FAILED'
           END,
           last_error = COALESCE(last_error, 'Stale PROCESSING lease expired before completion'),
           locked_at = NULL,
           next_retry_at = CASE
             WHEN attempts >= $1 THEN NULL
             ELSE NOW()
           END,
           quarantined_at = CASE
             WHEN attempts >= $1 THEN NOW()
             ELSE quarantined_at
           END,
           quarantine_reason = CASE
             WHEN attempts >= $1 THEN COALESCE(
               quarantine_reason,
               'Stale PROCESSING lease exceeded retry limit'
             )
             ELSE NULL
           END
       WHERE status = 'PROCESSING'
         AND locked_at IS NOT NULL
         AND locked_at < NOW() - INTERVAL '10 minutes'
       RETURNING id, status`,
      [ContractsService.CONTRACT_RESOLUTION_OUTBOX_MAX_ATTEMPTS],
    );
    const staleResetCount = staleResetResult.rows.filter((row: any) => row.status === 'FAILED').length;
    const staleQuarantinedCount = staleResetResult.rows.filter((row: any) => row.status === 'QUARANTINED').length;

    const groups = await this.pool.query(
      `SELECT contract_id, outcome
       FROM contract_resolution_side_effects
       WHERE (
         status = 'PENDING'
         OR (status = 'FAILED' AND (next_retry_at IS NULL OR next_retry_at <= NOW()))
       )
       GROUP BY contract_id, outcome
       ORDER BY MIN(created_at) ASC
       LIMIT $1`,
      [limit],
    );

    let groupsRetried = 0;
    let groupsFailed = 0;

    for (const row of groups.rows) {
      try {
        await this.drainContractResolutionSideEffects(row.contract_id, row.outcome);
        groupsRetried += 1;
      } catch (err) {
        groupsFailed += 1;
        this.logger.warn(
          `Outbox retry failed for contract ${row.contract_id} (${row.outcome}): ${
            err instanceof Error ? err.message : err
          }`,
        );
      }
    }

    const quarantinedTotal = await this.pool.query(
      `SELECT COUNT(*)::int AS count
       FROM contract_resolution_side_effects
       WHERE status = 'QUARANTINED'`,
    );

    return {
      staleResetCount,
      staleQuarantinedCount,
      groupsFound: groups.rows.length,
      groupsRetried,
      groupsFailed,
      quarantinedTotalCount: Number(quarantinedTotal.rows[0]?.count ?? 0),
    };
  }

  private getContractResolutionOutboxRetryDelayMs(attempts: number): number {
    const normalizedAttempts = Math.max(1, attempts);
    const exponentialMultiplier = 2 ** (normalizedAttempts - 1);
    const delayMs =
      ContractsService.CONTRACT_RESOLUTION_OUTBOX_RETRY_BASE_MS * exponentialMultiplier;
    return Math.min(delayMs, ContractsService.CONTRACT_RESOLUTION_OUTBOX_RETRY_MAX_MS);
  }

  private async dispatchContractResolutionSideEffect(effect: ContractResolutionSideEffectRow): Promise<void> {
    const payload = effect.payload || {};

    switch (effect.effect_type) {
      case 'STRIPE_CANCEL_HOLD':
        if (payload.paymentIntentId) {
          await this.stripe.cancelHold(payload.paymentIntentId);
        }
        return;
      case 'STRIPE_CAPTURE_STAKE':
        if (payload.paymentIntentId) {
          await this.stripe.captureStake(payload.paymentIntentId);
        }
        return;
      case 'STRIPE_CAPTURE_APPEAL_FEE':
        if (payload.paymentIntentId) {
          await this.stripe.captureStake(payload.paymentIntentId);
        }
        return;
      case 'STRIPE_CANCEL_APPEAL_FEE':
        if (payload.paymentIntentId) {
          await this.stripe.cancelHold(payload.paymentIntentId);
        }
        return;
      case 'LEDGER_STAKE_RETURN':
      case 'LEDGER_STAKE_CAPTURE':
      case 'LEDGER_BOUNTY_POOL_TOPUP': {
        const sideEffectKey = payload?.metadata?.sideEffectKey;
        if (sideEffectKey) {
          const existing = await this.pool.query(
            `SELECT id FROM entries
             WHERE contract_id = $1
               AND metadata->>'sideEffectKey' = $2
             LIMIT 1`,
            [effect.contract_id, sideEffectKey],
          );
          if (existing.rows.length > 0) {
            return;
          }
        }

        await this.ledger.recordTransaction(
          payload.debitAccountId,
          payload.creditAccountId,
          Number(payload.amount),
          effect.contract_id,
          payload.metadata,
        );
        return;
      }
      case 'TRUTH_CONTRACT_RESOLVED': {
        const sideEffectKey = payload?.payload?.sideEffectKey;
        if (sideEffectKey) {
          const existing = await this.pool.query(
            `SELECT id FROM event_log
             WHERE payload->>'sideEffectKey' = $1
             LIMIT 1`,
            [sideEffectKey],
          );
          if (existing.rows.length > 0) {
            return;
          }
        }

        await this.truthLog.appendEvent(payload.eventType, payload.payload);
        return;
      }
      case 'NOTIFY_CONTRACT_RESOLVED': {
        const sideEffectKey = payload?.metadata?.sideEffectKey;
        if (sideEffectKey) {
          const existing = await this.pool.query(
            `SELECT id FROM notifications
             WHERE user_id = $1
               AND type = $2
               AND metadata->>'sideEffectKey' = $3
             LIMIT 1`,
            [payload.userId, payload.type, sideEffectKey],
          );
          if (existing.rows.length > 0) {
            return;
          }
        }

        await this.notifications?.create(payload);
        return;
      }
      default:
        throw new Error(`Unknown contract resolution side effect type: ${(effect as any).effect_type}`);
    }
  }

  private buildCreateContractResponse(
    contractId: string,
    paymentIntentId: string,
    bountyLinkId: string | null,
    pricing?: PricingMetadata,
  ): { contractId: string; paymentIntentId: string; bountyLink?: string; pricing?: PricingMetadata } {
    const response: { contractId: string; paymentIntentId: string; bountyLink?: string; pricing?: PricingMetadata } = {
      contractId,
      paymentIntentId,
    };

    if (bountyLinkId) {
      const publicWebUrl = process.env.STYX_WEB_PUBLIC_URL || 'http://localhost:3001';
      response.bountyLink = `${publicWebUrl}/whistleblower/${bountyLinkId}`;
    }

    if (pricing) {
      response.pricing = pricing;
    }

    return response;
  }

  private normalizeContractPricing(dto: CreateContractInput): {
    dto: CreateContractInput;
    pricingMetadata?: PricingMetadata;
  } {
    const plan = dto.pricing?.plan ?? PricingPlan.CUSTOM;
    if (plan === PricingPlan.MVP_39) {
      return {
        dto: {
          ...dto,
          stakeAmount: MVP_39_STAKE_USD,
        },
        pricingMetadata: {
          plan: PricingPlan.MVP_39,
          totalEntryUsd: MVP_39_TOTAL_USD,
          platformFeeUsd: MVP_39_PLATFORM_FEE_USD,
          refundableStakeUsd: MVP_39_STAKE_USD,
        },
      };
    }

    return { dto };
  }

  private deriveCohortAlias(email: string | null | undefined, providedAlias?: string): string {
    const candidate = String(providedAlias || '').trim();
    if (candidate) {
      return candidate.slice(0, 32);
    }

    const local = String(email || '').split('@')[0] || 'anonymous';
    const first = local.split(/[._-]/)[0] || local;
    const cleaned = first.replace(/[^a-zA-Z]/g, '');
    if (!cleaned) {
      return 'Anonymous';
    }

    return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1, 31).toLowerCase()}`;
  }

  private async buildCohortMetadata(dto: CreateContractInput, user: any): Promise<Record<string, any> | null> {
    if (!dto.cohort) {
      return null;
    }

    const cohortId = String(dto.cohort.cohortId || '').trim();
    if (!cohortId) {
      throw new BadRequestException('cohort.cohortId is required when cohort metadata is provided');
    }

    const mode = dto.cohort.mode;
    const maxCohortSize = dto.cohort.maxCohortSize ?? DEFAULT_COHORT_MAX_MEMBERS;
    const maxPodSize = dto.cohort.maxPodSize ?? DEFAULT_POD_MAX_MEMBERS;
    const podId = dto.cohort.podId ? String(dto.cohort.podId).trim() : null;

    if (mode === CohortMode.POD_BASED && !podId) {
      throw new BadRequestException('cohort.podId is required for POD_BASED cohorts');
    }

    if (mode === CohortMode.POD_BASED && maxPodSize > DEFAULT_POD_MAX_MEMBERS) {
      throw new BadRequestException(`POD_BASED cohorts cap pod size at ${DEFAULT_POD_MAX_MEMBERS}`);
    }

    const existingEnrollment = await this.pool.query(
      `SELECT COUNT(*) AS count
       FROM contracts
       WHERE user_id = $1
         AND metadata->'cohort'->>'cohortId' = $2
         AND status IN ('PENDING_STAKE', 'ACTIVE')`,
      [dto.userId, cohortId],
    );

    if (Number(existingEnrollment.rows[0]?.count || 0) > 0) {
      throw new BadRequestException('User already has an active/pending contract in this cohort');
    }

    const cohortOccupancy = await this.pool.query(
      `SELECT COUNT(DISTINCT user_id) AS count
       FROM contracts
       WHERE metadata->'cohort'->>'cohortId' = $1
         AND status IN ('PENDING_STAKE', 'ACTIVE')`,
      [cohortId],
    );

    if (Number(cohortOccupancy.rows[0]?.count || 0) >= maxCohortSize) {
      throw new BadRequestException(`Cohort ${cohortId} is full (max ${maxCohortSize})`);
    }

    if (mode === CohortMode.POD_BASED && podId) {
      const podOccupancy = await this.pool.query(
        `SELECT COUNT(DISTINCT user_id) AS count
         FROM contracts
         WHERE metadata->'cohort'->>'cohortId' = $1
           AND metadata->'cohort'->>'podId' = $2
           AND status IN ('PENDING_STAKE', 'ACTIVE')`,
        [cohortId, podId],
      );

      if (Number(podOccupancy.rows[0]?.count || 0) >= maxPodSize) {
        throw new BadRequestException(`Pod ${podId} is full (max ${maxPodSize})`);
      }
    }

    return {
      cohortId,
      mode,
      podId,
      status: 'ACTIVE',
      maxCohortSize,
      maxPodSize,
      displayAlias: this.deriveCohortAlias(user.email, dto.cohort.displayAlias),
      joinedAt: new Date().toISOString(),
    };
  }

  private async markContractReconcileRequired(
    contractId: string,
    paymentIntentId: string | null,
    reason: string,
  ): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE contracts
         SET status = 'RECONCILE_REQUIRED',
             payment_intent_id = COALESCE(payment_intent_id, $2)
         WHERE id = $1`,
        [contractId, paymentIntentId],
      );
    } catch (err) {
      this.logger.error(
        `Failed to mark contract ${contractId} as RECONCILE_REQUIRED after error "${reason}": ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }

  private async hasContractLedgerSideEffect(contractId: string, sideEffectKey: string): Promise<boolean> {
    const existing = await this.pool.query(
      `SELECT id FROM entries
       WHERE contract_id = $1
         AND metadata->>'sideEffectKey' = $2
       LIMIT 1`,
      [contractId, sideEffectKey],
    );
    return existing.rows.length > 0;
  }

  private async hasTruthLogSideEffect(sideEffectKey: string): Promise<boolean> {
    const existing = await this.pool.query(
      `SELECT id FROM event_log
       WHERE payload->>'sideEffectKey' = $1
       LIMIT 1`,
      [sideEffectKey],
    );
    return existing.rows.length > 0;
  }

  private async hasNotificationSideEffect(
    userId: string,
    type: string,
    sideEffectKey: string,
  ): Promise<boolean> {
    const existing = await this.pool.query(
      `SELECT id FROM notifications
       WHERE user_id = $1
         AND type = $2
         AND metadata->>'sideEffectKey' = $3
       LIMIT 1`,
      [userId, type, sideEffectKey],
    );
    return existing.rows.length > 0;
  }

  private async runContractCreationActivationSideEffects(input: {
    contractId: string;
    dto: CreateContractInput;
    user: any;
    bountyLinkId: string | null;
  }): Promise<void> {
    const { contractId, dto, user, bountyLinkId } = input;
    const baseKey = `contract-create:${contractId}`;

    const priorContracts = await this.pool.query(
      `SELECT COUNT(*) as count FROM contracts WHERE user_id = $1 AND id != $2`,
      [dto.userId, contractId],
    );

    const escrowResult = await this.pool.query(
      `SELECT id FROM accounts WHERE name = 'SYSTEM_ESCROW' LIMIT 1`,
    );
    const escrowAccountId = escrowResult.rows[0]?.id ?? null;

    const bonus = grantOnboardingBonus(Number(priorContracts.rows[0]?.count ?? 0));
    if (bonus.granted && user.account_id && escrowAccountId) {
      const bonusLedgerKey = `${baseKey}:ledger:onboarding-bonus`;
      if (!(await this.hasContractLedgerSideEffect(contractId, bonusLedgerKey))) {
        await this.ledger.recordTransaction(
          escrowAccountId,
          user.account_id,
          ONBOARDING_BONUS_AMOUNT,
          contractId,
          { type: 'ONBOARDING_BONUS', userId: dto.userId, sideEffectKey: bonusLedgerKey },
        );
      }

      const bonusTruthKey = `${baseKey}:truth:onboarding-bonus`;
      if (!(await this.hasTruthLogSideEffect(bonusTruthKey))) {
        await this.truthLog.appendEvent('ONBOARDING_BONUS_GRANTED', {
          userId: dto.userId,
          amount: ONBOARDING_BONUS_AMOUNT,
          contractId,
          sideEffectKey: bonusTruthKey,
        });
      }
    }

    if (user.account_id && escrowAccountId) {
      const stakeHoldKey = `${baseKey}:ledger:stake-hold`;
      if (!(await this.hasContractLedgerSideEffect(contractId, stakeHoldKey))) {
        await this.ledger.recordTransaction(
          user.account_id,
          escrowAccountId,
          toCents(dto.stakeAmount),
          contractId,
          { type: 'STAKE_HOLD', userId: dto.userId, sideEffectKey: stakeHoldKey },
        );
      }
    }

    const contractCreatedTruthKey = `${baseKey}:truth:contract-created`;
    if (!(await this.hasTruthLogSideEffect(contractCreatedTruthKey))) {
      await this.truthLog.appendEvent('CONTRACT_CREATED', {
        contractId,
        userId: dto.userId,
        oathCategory: dto.oathCategory,
        stakeAmount: dto.stakeAmount,
        durationDays: dto.durationDays,
        sideEffectKey: contractCreatedTruthKey,
      });
    }

    const notificationKey = `${baseKey}:notification:contract-created`;
    try {
      if (
        this.notifications &&
        !(await this.hasNotificationSideEffect(dto.userId, 'CONTRACT_CREATED', notificationKey))
      ) {
        await this.notifications.create({
          userId: dto.userId,
          type: 'CONTRACT_CREATED',
          title: 'Contract Created',
          body: `Your ${dto.oathCategory.replace(/_/g, ' ').toLowerCase()} contract ($${dto.stakeAmount}) is now active.`,
          metadata: {
            contractId,
            bountyLinkId: bountyLinkId || undefined,
            sideEffectKey: notificationKey,
          },
        });
      }

      // Partner notification
      if (dto.oathCategory.startsWith('RECOVERY_') && dto.recoveryMetadata) {
        const partnerTruthKey = `${baseKey}:notification:partner-invited`;
        const partnerResult = await this.pool.query(
          `SELECT partner_user_id FROM accountability_partners WHERE contract_id = $1 LIMIT 1`,
          [contractId],
        );
        const partnerUserId = partnerResult.rows[0]?.partner_user_id;

        if (
          partnerUserId &&
          this.notifications &&
          !(await this.hasNotificationSideEffect(partnerUserId, 'PARTNER_INVITATION', partnerTruthKey))
        ) {
          await this.notifications.create({
            userId: partnerUserId,
            type: 'PARTNER_INVITATION',
            title: 'Partner Invitation',
            body: `${user.email} invited you to be their accountability partner for a recovery contract.`,
            metadata: { contractId, ownerEmail: user.email, sideEffectKey: partnerTruthKey },
          });
        }
      }
    } catch {
      // Notification failure must never abort a successful financial transaction.
    }
  }

  private async createContractTwoPhase(input: {
    dto: CreateContractInput;
    user: any;
    bountyLinkId: string | null;
    now: Date;
    endsAt: Date;
    contractMetadata: Record<string, any>;
    pricingMetadata?: PricingMetadata;
  }): Promise<{ contractId: string; paymentIntentId: string; bountyLink?: string; pricing?: PricingMetadata }> {
    const { dto, user, bountyLinkId, now, endsAt, contractMetadata, pricingMetadata } = input;
    const poolWithConnect = this.pool as unknown as { connect: () => Promise<PoolClient> };

    let contractId = '';
    const phaseAClient = await poolWithConnect.connect();
    try {
      await phaseAClient.query('BEGIN');

      // Derive realm_id from explicit DTO field or auto-derive from oath category
      const realmId = dto.realmId ?? getRealmForCategory(dto.oathCategory as OathCategory);

      const contractResult = await phaseAClient.query(
        `INSERT INTO contracts (user_id, oath_category, verification_method, stake_amount, payment_intent_id, duration_days, status, started_at, ends_at, metadata, bounty_link_id, realm_id)
         VALUES ($1, $2, $3, $4, NULL, $5, 'PENDING_STAKE', $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          dto.userId,
          dto.oathCategory,
          dto.verificationMethod,
          dto.stakeAmount,
          dto.durationDays,
          now.toISOString(),
          endsAt.toISOString(),
          JSON.stringify(contractMetadata),
          bountyLinkId,
          realmId,
        ],
      );
      contractId = contractResult.rows[0].id;

      if (bountyLinkId) {
        await phaseAClient.query(
          `INSERT INTO bounties (contract_id, bounty_link_id) VALUES ($1, $2)`,
          [contractId, bountyLinkId],
        );
      }

      if (dto.oathCategory.startsWith('RECOVERY_') && dto.recoveryMetadata) {
        // Find existing user if any
        const partnerUserResult = await phaseAClient.query(
          `SELECT id FROM users WHERE email = $1 LIMIT 1`,
          [dto.recoveryMetadata.accountabilityPartnerEmail],
        );
        const partnerUserId = partnerUserResult.rows[0]?.id || null;

        await phaseAClient.query(
          `INSERT INTO accountability_partners (contract_id, partner_email, partner_user_id, status)
           VALUES ($1, $2, $3, 'PENDING')`,
          [contractId, dto.recoveryMetadata.accountabilityPartnerEmail, partnerUserId],
        );
      }

      await phaseAClient.query('COMMIT');
    } catch (err) {
      try {
        await phaseAClient.query('ROLLBACK');
      } catch {
        // Preserve original failure.
      }
      throw err;
    } finally {
      phaseAClient.release();
    }

    const paymentIntent = await this.stripe.holdStake(
      user.stripe_customer_id,
      toCents(dto.stakeAmount),
      contractId,
    );

    const phaseBClient = await poolWithConnect.connect();
    try {
      await phaseBClient.query('BEGIN');

      const contractRow = await phaseBClient.query(
        `SELECT id, status, payment_intent_id
         FROM contracts
         WHERE id = $1
         FOR UPDATE`,
        [contractId],
      );

      if (contractRow.rows.length === 0) {
        throw new NotFoundException(`Contract ${contractId} not found during finalization`);
      }

      const existing = contractRow.rows[0];
      if (!(existing.status === 'ACTIVE' && existing.payment_intent_id)) {
        await phaseBClient.query(
          `UPDATE contracts
           SET payment_intent_id = $1,
               status = 'ACTIVE',
               started_at = COALESCE(started_at, $3),
               ends_at = COALESCE(ends_at, $4)
           WHERE id = $2`,
          [paymentIntent.id, contractId, now.toISOString(), endsAt.toISOString()],
        );
      }

      await phaseBClient.query('COMMIT');
    } catch (err) {
      try {
        await phaseBClient.query('ROLLBACK');
      } catch {
        // Preserve original failure.
      }

      try {
        await this.stripe.cancelHold(paymentIntent.id);
      } catch (cancelErr) {
        await this.markContractReconcileRequired(
          contractId,
          paymentIntent.id,
          `phase_b_finalize_failed:${cancelErr instanceof Error ? cancelErr.message : cancelErr}`,
        );
      }

      throw new InternalServerErrorException(
        'Contract activation failed after payment authorization. Compensation attempted.',
      );
    } finally {
      phaseBClient.release();
    }

    try {
      await this.runContractCreationActivationSideEffects({
        contractId,
        dto,
        user,
        bountyLinkId,
      });
    } catch (err) {
      await this.markContractReconcileRequired(
        contractId,
        paymentIntent.id,
        `contract_create_side_effect_failure:${err instanceof Error ? err.message : err}`,
      );
      try {
        await this.stripe.cancelHold(paymentIntent.id);
      } catch {
        // Reconciliation state already recorded above.
      }
      throw new InternalServerErrorException(
        'Contract finalization side effects failed. Reconciliation required.',
      );
    }

    return this.buildCreateContractResponse(contractId, paymentIntent.id, bountyLinkId, pricingMetadata);
  }

  async createContract(dto: CreateContractInput): Promise<{ contractId: string; paymentIntentId: string; bountyLink?: string; pricing?: PricingMetadata }> {
    // 1. Validate oath category
    const validCategories = Object.values(OathCategory) as string[];
    if (!validCategories.includes(dto.oathCategory)) {
      throw new BadRequestException(`Invalid oath category: ${dto.oathCategory}`);
    }

    const validMethods = Object.values(VerificationMethod) as string[];
    if (!validMethods.includes(dto.verificationMethod)) {
      throw new BadRequestException(`Invalid verification method: ${dto.verificationMethod}`);
    }

    // 1b. Validate oath-to-method mapping
    if (!validateOathMapping(dto.oathCategory as OathCategory, dto.verificationMethod as VerificationMethod)) {
      throw new BadRequestException(
        `Verification method ${dto.verificationMethod} is not valid for oath category ${dto.oathCategory}`,
      );
    }

    const pricingPlan = this.normalizeContractPricing(dto);
    dto = pricingPlan.dto;

    // 2. Fetch user
    const userResult = await this.pool.query('SELECT * FROM users WHERE id = $1', [dto.userId]);
    if (userResult.rows.length === 0) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }
    const user = userResult.rows[0];

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('User account is not active');
    }

    // 2b. Cool-off period: 7-day lockout after a failure
    const recentFailures = await this.pool.query(
      `SELECT COUNT(*) as count FROM contracts
       WHERE user_id = $1 AND status = 'FAILED'
       AND updated_at > NOW() - make_interval(days => $2)`,
      [dto.userId, FAILURE_COOL_OFF_DAYS],
    );
    if (Number(recentFailures.rows[0].count) > 0) {
      throw new ForbiddenException(
        `Cool-off period active: ${FAILURE_COOL_OFF_DAYS}-day lockout after contract failure`,
      );
    }

    // 2c. Self-Exclusion Protocol: check if user is voluntarily locked out
    if (user.self_exclusion_expires_at && new Date(user.self_exclusion_expires_at) > new Date()) {
      throw new ForbiddenException(
        `Self-exclusion active until ${new Date(user.self_exclusion_expires_at).toLocaleDateString()}`,
      );
    }

    // 3. Validate stake amount against integrity tier
    const tiers = getAllowedTiers(user.integrity_score);
    if (tiers[0] === 'RESTRICTED_MODE') {
      throw new ForbiddenException('Integrity score too low — account is in restricted mode');
    }

    // 3b. Stake tier limit
    const stakeAmountCents = toCents(dto.stakeAmount);
    const tierMax = getTierMaxStake(tiers);
    if (stakeAmountCents > tierMax) {
      throw new BadRequestException(
        `Stake amount $${dto.stakeAmount} exceeds tier limit of $${toDollars(tierMax)}`,
      );
    }

    // 3c. Dynamic downscaling: after 3 failures, max stake is halved per 3 failures
    const totalFailures = await this.pool.query(
      `SELECT COUNT(*) as count FROM contracts WHERE user_id = $1 AND status = 'FAILED'`,
      [dto.userId],
    );
    const failCount = Number(totalFailures.rows[0].count);
    if (failCount >= DOWNSCALE_STRIKE_THRESHOLD) {
      const downscaleFactor = Math.pow(0.5, Math.floor(failCount / DOWNSCALE_STRIKE_THRESHOLD));
      const maxStake = tierMax * downscaleFactor;
      if (stakeAmountCents > maxStake) {
        throw new BadRequestException(
          `Dynamic downscaling: max stake is $${toDollars(maxStake).toFixed(2)} after ${failCount} failures`,
        );
      }
    }

    // 3. Aegis Protocol Verification (Psychological / Financial Guardrails)
    this.aegis.validatePsychologicalGuardrails(
      stakeAmountCents,
      dto.durationDays,
      user.integrity_score,
      Number(totalFailures.rows[0].count)
    );

    // 3e. Aegis Health Guard: Enforce BMI floor and velocity caps for BIOLOGICAL oaths
    if (dto.oathCategory === 'BIOLOGICAL' && dto.healthMetrics) {
      this.aegis.validateHealthMetrics(dto.healthMetrics, dto.durationDays);
    }

    // 3d. KYC tier gating (Phase Beta P0-003)
    if (this.compliancePolicy) {
      const kycResult = await this.compliancePolicy.evaluateKycRequirement(
        dto.userId,
        dto.stakeAmount,
      );
      if (!kycResult.allowed) {
        throw new ForbiddenException(kycResult.reason || 'KYC verification required');
      }
    }

    // 4b. If recovery oath, run Recovery Protocol guardrails
    if (dto.oathCategory.startsWith('RECOVERY_')) {
      await this.recovery.validateRecoveryContract(
        dto.userId,
        dto.oathCategory,
        dto.durationDays,
        dto.recoveryMetadata,
      );
      // Enforce duration cap for RECOVERY_NOCONTACT
      if (dto.durationDays > MAX_NOCONTACT_DURATION_DAYS) {
        dto = { ...dto, durationDays: MAX_NOCONTACT_DURATION_DAYS };
      }
    }


    // Generate unique Whistleblower Bounty Link for No Contact
    let bountyLinkId: string | null = null;
    if (dto.oathCategory === 'RECOVERY_NOCONTACT') {
       const crypto = require('crypto');
       bountyLinkId = crypto.randomBytes(32).toString('hex');
    }

    // 5. Hold stake via Stripe FBO
    if (!user.stripe_customer_id) {
      throw new BadRequestException('User has no payment method on file');
    }

    const cohortMetadata = await this.buildCohortMetadata(dto, user);

    const now = new Date();
    const endsAt = new Date(now.getTime() + dto.durationDays * 24 * 60 * 60 * 1000);
    const contractMetadata: Record<string, any> = {};
    if (dto.recoveryMetadata) {
      contractMetadata.recovery = {
        noContactIdentifiers: dto.recoveryMetadata.noContactIdentifiers,
        acknowledgments: dto.recoveryMetadata.acknowledgments,
      };
    }
    if (cohortMetadata) {
      contractMetadata.cohort = cohortMetadata;
    }
    if (pricingPlan.pricingMetadata) {
      contractMetadata.pricing = pricingPlan.pricingMetadata;
    }

    const supportsTransactionalPath =
      typeof (this.pool as unknown as { connect?: unknown }).connect === 'function';

    if (supportsTransactionalPath) {
      return this.createContractTwoPhase({
        dto,
        user,
        bountyLinkId,
        now,
        endsAt,
        contractMetadata,
        pricingMetadata: pricingPlan.pricingMetadata,
      });
    }

    // Insert contract first with PENDING_STAKE status (mirrors two-phase pattern)
    const contractResult = await this.pool.query(
      `INSERT INTO contracts (user_id, oath_category, verification_method, stake_amount, payment_intent_id, duration_days, status, started_at, ends_at, metadata, bounty_link_id)
       VALUES ($1, $2, $3, $4, NULL, $5, 'PENDING_STAKE', $6, $7, $8, $9)
       RETURNING id`,
      [dto.userId, dto.oathCategory, dto.verificationMethod, dto.stakeAmount, dto.durationDays, now.toISOString(), endsAt.toISOString(), JSON.stringify(contractMetadata), bountyLinkId],
    );
    const contractId = contractResult.rows[0].id;

    // Hold stake with real contract ID
    const paymentIntent = await this.stripe.holdStake(
      user.stripe_customer_id,
      toCents(dto.stakeAmount),
      contractId,
    );

    // Activate contract with payment intent
    await this.pool.query(
      `UPDATE contracts SET status = 'ACTIVE', payment_intent_id = $1 WHERE id = $2`,
      [paymentIntent.id, contractId],
    );

    if (bountyLinkId) {
      // Insert corresponding bounty record to track the link's state
      await this.pool.query(
          `INSERT INTO bounties (contract_id, bounty_link_id) VALUES ($1, $2)`,
          [contractId, bountyLinkId]
      );
    }

    // 6b. If recovery oath, create accountability partner row
    if (dto.oathCategory.startsWith('RECOVERY_') && dto.recoveryMetadata) {
      await this.pool.query(
        `INSERT INTO accountability_partners (contract_id, partner_email, status)
         VALUES ($1, $2, 'PENDING')`,
        [contractId, dto.recoveryMetadata.accountabilityPartnerEmail],
      );
    }

    // 7. Check for onboarding bonus (first contract)
    const priorContracts = await this.pool.query(
      `SELECT COUNT(*) as count FROM contracts WHERE user_id = $1 AND id != $2`,
      [dto.userId, contractId],
    );
    const bonus = grantOnboardingBonus(Number(priorContracts.rows[0].count));
    if (bonus.granted && user.account_id) {
      const escrowCheck = await this.pool.query(
        `SELECT id FROM accounts WHERE name = 'SYSTEM_ESCROW' LIMIT 1`,
      );
      if (escrowCheck.rows.length > 0) {
        await this.ledger.recordTransaction(
          escrowCheck.rows[0].id,
          user.account_id,
          ONBOARDING_BONUS_AMOUNT,
          contractId,
          { type: 'ONBOARDING_BONUS', userId: dto.userId },
        );
      }
      await this.truthLog.appendEvent('ONBOARDING_BONUS_GRANTED', {
        userId: dto.userId,
        amount: ONBOARDING_BONUS_AMOUNT,
        contractId,
      });
    }

    // 8. Record ledger entry (user asset → escrow liability)
    if (user.account_id) {
      // Use a system escrow account — create one if needed
      const escrowResult = await this.pool.query(
        `SELECT id FROM accounts WHERE name = 'SYSTEM_ESCROW' LIMIT 1`,
      );
      if (escrowResult.rows.length > 0) {
        await this.ledger.recordTransaction(
          user.account_id,
          escrowResult.rows[0].id,
          toCents(dto.stakeAmount),
          contractId,
          { type: 'STAKE_HOLD', userId: dto.userId },
        );
      }
    }

    // 9. Log to TruthLog
    await this.truthLog.appendEvent('CONTRACT_CREATED', {
      contractId,
      userId: dto.userId,
      oathCategory: dto.oathCategory,
      stakeAmount: dto.stakeAmount,
      durationDays: dto.durationDays,
    });

    // 10. Notify user (non-critical — must not break the financial transaction)
    try {
      await this.notifications?.create({
        userId: dto.userId,
        type: 'CONTRACT_CREATED',
        title: 'Contract Created',
        body: `Your ${dto.oathCategory.replace(/_/g, ' ').toLowerCase()} contract ($${dto.stakeAmount}) is now active.`,
        metadata: { contractId },
      });
    } catch {
      // Notification failure must never abort a successful financial transaction
    }

    return this.buildCreateContractResponse(
      contractId,
      paymentIntent.id,
      bountyLinkId,
      pricingPlan.pricingMetadata,
    );
  }

  async getContract(contractId: string, requester?: ContractReadRequester) {
    const result = await this.pool.query(
      `SELECT c.*, u.email, u.integrity_score,
              (SELECT COUNT(*) FROM proofs p WHERE p.contract_id = c.id) as proof_count
       FROM contracts c 
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [contractId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }
    const row = result.rows[0];
    if (requester) {
      await this.assertCanReadContractRow(row, requester);
    }

    // Fetch proof details
    const proofsResult = await this.pool.query(
      `SELECT id, submitted_at as timestamp, status, media_uri as media_url 
       FROM proofs WHERE contract_id = $1 ORDER BY submitted_at DESC`,
      [contractId],
    );

    return {
      ...row,
      proof_count: parseInt(row.proof_count, 10),
      proofs: proofsResult.rows,
      grace_days_max: 2, // Hardcoded for beta
    };
  }

  async claimBounty(bountyLinkId: string, mediaUri: string, claimantIp: string): Promise<{ proofId: string; jobId: string }> {
    // 1. Verify the bounty link is valid and ACTIVE
    const bountyResult = await this.pool.query(
      `SELECT b.*, c.user_id, c.status as contract_status
       FROM bounties b
       JOIN contracts c ON b.contract_id = c.id
       WHERE b.bounty_link_id = $1`,
      [bountyLinkId]
    );

    if (bountyResult.rows.length === 0) {
      throw new NotFoundException('Invalid bounty link');
    }

    const bounty = bountyResult.rows[0];

    if (bounty.status !== 'ACTIVE' || bounty.contract_status !== 'ACTIVE') {
      throw new BadRequestException('This bounty is no longer active or has already been claimed.');
    }

    // 2. Atomically claim the bounty. The WHERE status = 'ACTIVE' guard closes
    //    the TOCTOU window between the read above and this write: only the first
    //    concurrent claimant wins the conditional UPDATE; a losing racer gets
    //    zero rows back and is rejected.
    const claim = await this.pool.query(
      `UPDATE bounties SET status = 'CLAIMED', claimed_at = NOW(), claimant_ip = $1
       WHERE id = $2 AND status = 'ACTIVE'
       RETURNING id`,
      [claimantIp, bounty.id]
    );
    if (claim.rows.length === 0) {
      throw new BadRequestException('This bounty is no longer active or has already been claimed.');
    }

    // 3. Create a proof submission on behalf of the Ex (linked to the user's contract)
    const proofResult = await this.pool.query(
      `INSERT INTO proofs (contract_id, user_id, media_uri, status, is_honeypot)
       VALUES ($1, $2, $3, 'PENDING_REVIEW', false)
       RETURNING id`,
      [bounty.contract_id, bounty.user_id, mediaUri]
    );
    const proofId = proofResult.rows[0].id;

    // 4. Route to Fury network with high priority
    const jobId = await this.furyRouter.routeProof(proofId, bounty.user_id, 5); // Higher priority for bounties

    // 5. Log it
    await this.truthLog.appendEvent('BOUNTY_CLAIMED', {
      bountyId: bounty.id,
      contractId: bounty.contract_id,
      proofId,
    });

    return { proofId, jobId };
  }

  async submitProof(contractId: string, dto: SubmitProofInput): Promise<{ proofId: string; jobId: string; rejected?: boolean; reason?: string }> {
    // 1. Validate contract ownership and status
    const contract = await this.pool.query(
      'SELECT * FROM contracts WHERE id = $1',
      [contractId],
    );
    if (contract.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }
    await this.assertCanWriteContractRow(contract.rows[0], { userId: dto.userId });
    if (contract.rows[0].status !== 'ACTIVE') {
      throw new BadRequestException(`Contract is not active (status: ${contract.rows[0].status})`);
    }

    // 2. Run anomaly detection before routing to Fury
    const anomalyResult = await this.anomaly.analyze(dto.mediaUri, dto.userId);

    // 3. Insert proof row
    const proofResult = await this.pool.query(
      `INSERT INTO proofs (contract_id, user_id, media_uri, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [contractId, dto.userId, dto.mediaUri, anomalyResult.rejected ? 'AUTO_REJECTED' : 'PENDING_REVIEW'],
    );
    const proofId = proofResult.rows[0].id;

    // If anomaly detected, auto-reject without routing to Fury
    if (anomalyResult.rejected) {
      await this.truthLog.appendEvent('PROOF_AUTO_REJECTED', {
        proofId,
        contractId,
        userId: dto.userId,
        reason: anomalyResult.reason,
      });
      return { proofId, jobId: 'auto-rejected', rejected: true, reason: anomalyResult.reason };
    }

    // 4. Route to Fury network via BullMQ
    const jobId = await this.furyRouter.routeProof(proofId, dto.userId, 3);

    // 5. Log to TruthLog
    await this.truthLog.appendEvent('PROOF_SUBMITTED', {
      proofId,
      contractId,
      userId: dto.userId,
      anomalyFlags: anomalyResult.flags,
    });

    // 6. Notify user (non-critical)
    try {
      await this.notifications?.create({
        userId: dto.userId,
        type: 'PROOF_SUBMITTED',
        title: 'Proof Submitted',
        body: 'Your proof has been submitted and routed to the Fury network for review.',
        metadata: { proofId, contractId },
      });
    } catch {
      // Notification failure must never abort a successful proof submission
    }

    return { proofId, jobId };
  }

  async resolveContract(
    contractId: string,
    outcome: 'COMPLETED' | 'FAILED',
  ): Promise<void> {
    const maybeConnect = (this.pool as unknown as { connect?: () => Promise<PoolClient> }).connect;
    const client = typeof maybeConnect === 'function' ? await maybeConnect.call(this.pool) : null;
    const db: { query: PoolClient['query'] } = (client ?? this.pool) as any;
    const useTransaction = !!client;

    let row: any;
    let resolutionQuote: ReturnType<typeof buildSettlementQuote> | null = null;

    try {
      if (useTransaction) {
        await db.query('BEGIN');
      }

      const contract = await db.query(
        useTransaction
          ? 'SELECT * FROM contracts WHERE id = $1 FOR UPDATE'
          : 'SELECT * FROM contracts WHERE id = $1',
        [contractId],
      );
      if (contract.rows.length === 0) {
        throw new NotFoundException(`Contract ${contractId} not found`);
      }

      row = contract.rows[0];

      if (row.status === outcome) {
        if (useTransaction) {
          await db.query('COMMIT');
        }
        return;
      }

      if (row.status === 'COMPLETED' || row.status === 'FAILED') {
        throw new BadRequestException(`Contract ${contractId} already resolved as ${row.status}`);
      }

      // Claim the transition atomically. In the transactional path the row is
      // already pinned by FOR UPDATE; in the non-transactional fallback the
      // `status NOT IN ('COMPLETED','FAILED')` predicate is the lock+re-check —
      // the UPDATE takes a row lock for the duration of the statement and the
      // WHERE clause re-checks the idempotency guard, so if two concurrent crons
      // both pass the read above only one of them actually transitions the row;
      // the loser's UPDATE matches zero rows and is a no-op. The downstream
      // settlement side effects are independently idempotent (settlement dedupe
      // / ledger sideEffectKey), so a no-op transition cannot double-allocate.
      const claim = await db.query(
        `UPDATE contracts SET status = $1
         WHERE id = $2 AND status NOT IN ('COMPLETED', 'FAILED')
         RETURNING id`,
        [outcome, contractId],
      );

      // In the non-transactional fallback there is no FOR UPDATE lock held across
      // the read above and this write, so a concurrent resolver may have already
      // transitioned the contract to a terminal status. When that happens the
      // conditional UPDATE matches zero rows; we must NOT proceed to dispatch
      // settlement or record ledger entries (the winning resolver already owns
      // those side effects), mirroring the claimBounty / grace-day bail-out. The
      // transactional path can never see zero rows here (the row is pinned and we
      // already re-checked its status under the lock), so this guard is a no-op
      // there.
      if (!useTransaction && claim.rows.length === 0) {
        return;
      }

      // Update user integrity score
      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [row.user_id]);
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const history: UserHistory = {
          userId: user.id,
          completedOaths: outcome === 'COMPLETED' ? 1 : 0,
          fraudStrikes: 0,
          failedOaths: outcome === 'FAILED' ? 1 : 0,
          monthsInactive: 0,
        };
        // Recalculate based on delta (simplified: apply bonus/penalty to current score)
        // Aegis: Apply 1.5x volatility multiplier for weekend breaches
        const volatilityMultiplier = this.aegis.getVolatilityMultiplier();
        const baseDelta = calculateIntegrity(history) - 50; // offset from base
        const delta = (outcome === 'FAILED' && volatilityMultiplier > 1)
          ? Math.round(baseDelta * volatilityMultiplier)
          : baseDelta;

        const newScore = Math.max(0, user.integrity_score + delta);
        
        // F-UX-09: Grant Phoenix Recovery badge if completing after a failure
        if (outcome === 'COMPLETED') {
          const lastContract = await db.query(
            `SELECT status FROM contracts 
             WHERE user_id = $1 AND id != $2 AND status IN ('COMPLETED', 'FAILED')
             ORDER BY updated_at DESC LIMIT 1`,
            [user.id, contractId]
          );
          
          if (lastContract.rows.length > 0 && lastContract.rows[0].status === 'FAILED') {
            await db.query(
              `UPDATE users 
               SET badges = badges || jsonb_build_object('type', 'PHOENIX_RECOVERY', 'grantedAt', NOW())
               WHERE id = $1 AND NOT (badges @> '[{"type": "PHOENIX_RECOVERY"}]')`,
              [user.id]
            );
          }
        }

        await db.query(
          'UPDATE users SET integrity_score = $1 WHERE id = $2',
          [newScore, user.id],
        );
      }

      if (useTransaction) {
        let jurisdictionTier: JurisdictionTier | undefined;
        if (outcome === 'FAILED') {
          const jurisdiction = await db.query(
            'SELECT tier FROM jurisdictions WHERE code = $1',
            [userResult.rows[0]?.last_known_state || 'UNKNOWN']
          );
          jurisdictionTier = (jurisdiction.rows[0]?.tier || JurisdictionTier.TIER_3) as JurisdictionTier;
        }

        const escrowResult = await db.query(
          `SELECT id FROM accounts WHERE name = 'SYSTEM_ESCROW' LIMIT 1`,
        );
        const revenueResult = outcome === 'FAILED'
          ? await db.query(`SELECT id FROM accounts WHERE name = 'SYSTEM_REVENUE' LIMIT 1`)
          : { rows: [] as any[] };
        const bountyPoolResult = outcome === 'FAILED'
          ? await db.query(`SELECT id FROM accounts WHERE name = 'FURY_BOUNTY_POOL' LIMIT 1`)
          : { rows: [] as any[] };

        const effects = this.buildContractResolutionSideEffects({
          contractId,
          outcome,
          contractRow: row,
          userRow: userResult.rows[0],
          escrowAccountId: escrowResult.rows[0]?.id ?? null,
          revenueAccountId: revenueResult.rows[0]?.id ?? null,
          bountyPoolAccountId: bountyPoolResult.rows[0]?.id ?? null,
          jurisdictionTier,
        });
        await this.enqueueContractResolutionSideEffects(db, effects);
      } else {
        // LC6: In the non-transactional fallback the status claim above
        // auto-commits (there is no enclosing transaction to roll back), so the
        // contract is ALREADY terminal (COMPLETED/FAILED) before any money moves.
        // The outer catch only rolls back when useTransaction is true, so a
        // settlement failure here would otherwise strand a terminally-resolved
        // contract with the stake un-moved and no retry path. We therefore wrap
        // the settlement work and, on failure, revert the status back to its
        // pre-resolution value (`previousStatus`) so a subsequent resolveContract
        // can re-claim and re-settle — mirroring the proof RESOLVING→UNDER_REVIEW
        // revert in fury.worker. The downstream settlement side effects are
        // independently idempotent (settlement dedupe / ledger sideEffectKey), so
        // a re-resolution cannot double-allocate.
        const previousStatus = row.status;
        try {
        const stakeAmountCents = this.stakeAmountToCents(row.stake_amount);
        let dispositionMode: 'CAPTURE' | 'REFUND' =
          outcome === 'COMPLETED' ? 'REFUND' : 'CAPTURE';

        // TKT-P0-001: Background Settlement via BullMQ
        if (outcome === 'FAILED') {
          // Resolve jurisdiction tier for P0-011 disposition logic
          const jurisdiction = await db.query(
            'SELECT tier FROM jurisdictions WHERE code = $1',
            [userResult.rows[0]?.last_known_state || 'UNKNOWN']
          );
          const tier = (jurisdiction.rows[0]?.tier || JurisdictionTier.TIER_3) as JurisdictionTier;
          dispositionMode = this.stripe.resolveDisposition('FAILED', tier);
        }
        const quote = buildSettlementQuote(
          stakeAmountCents,
          outcome === 'COMPLETED' ? 'PASS' : 'FAIL',
          dispositionMode,
        );
        resolutionQuote = quote;

        if (row.payment_intent_id && this.settlementService) {
          await this.settlementService.dispatchSettlement({
            contractId,
            outcome: outcome === 'COMPLETED' ? 'PASS' : 'FAIL',
            paymentIntentId: row.payment_intent_id,
            amountCents: stakeAmountCents,
            dispositionMode,
            // In a future Gamma sprint, we'd include furies array here
          });
        } else if (userResult.rows[0]?.account_id) {
          const escrowResult = await db.query(
            `SELECT id FROM accounts WHERE name = 'SYSTEM_ESCROW' LIMIT 1`,
          );
          if (escrowResult.rows.length > 0) {
            if (quote.actualAction === 'RELEASE') {
              // Return from escrow to user. When an outer transaction is in
              // flight (the contract row is pinned by FOR UPDATE on `client`),
              // the posting MUST join that transaction so it rolls back with the
              // status change if a later step fails — never commit independently.
              await this.ledger.recordTransaction(
                escrowResult.rows[0].id,
                userResult.rows[0].account_id,
                stakeAmountCents,
                contractId,
                {
                  type: outcome === 'FAILED' ? 'REFUND_ONLY_DISPOSITION' : 'STAKE_RETURN',
                  outcome,
                  actualAction: quote.actualAction,
                },
                client ?? undefined,
              );
            } else {
              // Move from escrow to revenue, then top up the bounty pool. These
              // two postings must be atomic with each other AND with the contract
              // status transition: capturing the stake into revenue while the
              // contract later reverts (outer ROLLBACK) would strand funds in
              // SYSTEM_REVENUE for an unresolved contract.
              //
              // When an outer transaction client is in use we reuse it so the
              // capture participates in — and rolls back with — that single
              // atomic transaction (no nested BEGIN/COMMIT). Only when there is
              // genuinely no outer transaction do we open a dedicated connection
              // so the two postings remain atomic relative to each other.
              const revenueResult = await db.query(
                `SELECT id FROM accounts WHERE name = 'SYSTEM_REVENUE' LIMIT 1`,
              );
              if (revenueResult.rows.length > 0) {
                const bountyResult = quote.bountyPoolCents > 0
                  ? await db.query(`SELECT id FROM accounts WHERE name = 'FURY_BOUNTY_POOL' LIMIT 1`)
                  : { rows: [] as any[] };

                let ledgerClient: PoolClient | null = null;
                let ownsLedgerTransaction = false;
                if (client) {
                  // Reuse the outer transaction; do not open a new BEGIN/COMMIT.
                  ledgerClient = client;
                } else {
                  const captureConnect = (this.pool as unknown as { connect?: () => Promise<PoolClient> }).connect;
                  ledgerClient = typeof captureConnect === 'function'
                    ? await captureConnect.call(this.pool)
                    : null;
                  ownsLedgerTransaction = !!ledgerClient;
                }
                try {
                  if (ownsLedgerTransaction && ledgerClient) await ledgerClient.query('BEGIN');

                  await this.ledger.recordTransaction(
                    escrowResult.rows[0].id,
                    revenueResult.rows[0].id,
                    stakeAmountCents,
                    contractId,
                    {
                      type: 'STAKE_CAPTURED',
                      outcome,
                      platformFeeCents: quote.platformFeeCents,
                      bountyPoolCents: quote.bountyPoolCents,
                    },
                    ledgerClient ?? undefined,
                  );

                  if (quote.bountyPoolCents > 0 && bountyResult.rows.length > 0) {
                    await this.ledger.recordTransaction(
                      revenueResult.rows[0].id,
                      bountyResult.rows[0].id,
                      quote.bountyPoolCents,
                      contractId,
                      { type: 'BOUNTY_POOL_TOPUP', outcome },
                      ledgerClient ?? undefined,
                    );
                  }

                  if (ownsLedgerTransaction && ledgerClient) await ledgerClient.query('COMMIT');
                } catch (captureErr) {
                  // Only roll back a transaction we own here. When reusing the
                  // outer transaction, the outer catch block performs the
                  // ROLLBACK so the capture and status change revert together.
                  if (ownsLedgerTransaction && ledgerClient) {
                    try {
                      await ledgerClient.query('ROLLBACK');
                    } catch {
                      // Preserve original failure.
                    }
                  }
                  throw captureErr;
                } finally {
                  // Only release a connection we opened; the outer client is
                  // released by the outer finally block.
                  if (ownsLedgerTransaction) {
                    ledgerClient?.release();
                  }
                }
              }
            }
          }
        }

        // Log to TruthLog
        await this.truthLog.appendEvent('CONTRACT_RESOLVED', {
          contractId,
          outcome,
          userId: row.user_id,
          stakeAmount: Number(row.stake_amount),
        });
        } catch (settlementErr) {
          // Settlement failed AFTER the status was committed terminal. Revert the
          // status to its pre-resolution value so the contract is no longer stuck
          // resolved-with-money-unmoved; a retry can then re-claim and re-settle.
          // Guarded so we only revert OUR terminal write (status still === outcome).
          try {
            await db.query(
              `UPDATE contracts SET status = $1 WHERE id = $2 AND status = $3`,
              [previousStatus, contractId, outcome],
            );
          } catch {
            // If the compensating revert itself fails, preserve the original error.
          }
          throw settlementErr;
        }
      }

      if (useTransaction) {
        await db.query('COMMIT');
      }
    } catch (err) {
      if (useTransaction) {
        try {
          await db.query('ROLLBACK');
        } catch {
          // Ignore rollback errors; preserve original exception.
        }
      }
      throw err;
    } finally {
      client?.release();
    }

    if (useTransaction) {
      await this.drainContractResolutionSideEffects(contractId, outcome);
      return;
    }

    // Notify user of resolution (non-critical)
    try {
      await this.notifications?.create({
        userId: row.user_id,
        type: 'CONTRACT_RESOLVED',
        title: outcome === 'COMPLETED' ? 'Contract Completed' : 'Contract Failed',
        body: outcome === 'COMPLETED'
          ? `Your contract has been fulfilled. $${Number(row.stake_amount).toFixed(2)} returned.`
          : resolutionQuote?.actualAction === 'RELEASE'
            ? `Your contract has failed, but $${Number(row.stake_amount).toFixed(2)} was returned under the jurisdictional refund rule.`
            : `Your contract has failed. $${Number(row.stake_amount).toFixed(2)} has been captured.`,
        metadata: { contractId, outcome },
      });
    } catch {
      // Notification failure must never abort a successful resolution
    }
  }

  /** Calendar-month marker (UTC 'YYYY-MM') used to scope the per-month grace-day cap. */
  private currentGraceMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  async useGraceDay(contractId: string, userId: string): Promise<{ newDeadline: Date }> {
    const contract = await this.pool.query(
      'SELECT * FROM contracts WHERE id = $1',
      [contractId],
    );
    if (contract.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }
    const row = contract.rows[0];
    await this.assertCanWriteContractRow(row, { userId });
    if (row.status !== 'ACTIVE') {
      throw new BadRequestException(`Contract is not active (status: ${row.status})`);
    }

    // MAX_GRACE_DAYS_PER_MONTH is a per-USER, per-CALENDAR-MONTH cap (LC2) — NOT
    // a per-contract cap. Counting only this contract's grace_days_used would let
    // a user with N active contracts burn 2*N grace days a month. We therefore sum
    // grace_days_used across ALL of the user's contracts whose grace_period_month
    // is the current calendar month. contracts.grace_days_used counts grace days
    // within the month recorded in contracts.grace_period_month; when the current
    // month differs from a row's stored marker that row's usage has logically
    // reset to 0, so a long-running contract regains allowance each month. The
    // same per-contract grace_days_used column is read by getAttestationStatus.
    const currentMonth = this.currentGraceMonth();
    const storedMonth: string | null = row.grace_period_month ?? null;
    const storedCount = Number(row.grace_days_used || 0);

    // Per-user usage this calendar month, summed across the user's contracts.
    const userUsageRes = await this.pool.query(
      `SELECT COALESCE(SUM(grace_days_used), 0) AS used
       FROM contracts
       WHERE user_id = $1 AND grace_period_month = $2`,
      [row.user_id, currentMonth],
    );
    const usedThisMonth = Number(userUsageRes.rows[0]?.used || 0);

    const result = useGraceDay(usedThisMonth, new Date(row.ends_at));
    if (!result.success) {
      throw new BadRequestException(result.reason);
    }

    // This contract's own usage this calendar month (reset to 0 on month rollover).
    const contractUsedThisMonth = storedMonth === currentMonth ? storedCount : 0;

    // Atomically extend the deadline, stamp the current month, and set this
    // contract's counter to (contractUsedThisMonth + 1). The CAS guard re-checks
    // BOTH the raw counter and the month marker we read above (NULL-safe via IS
    // NOT DISTINCT FROM) so two concurrent grace-day requests against this
    // contract — or a request racing a month rollover — can't both pass; the
    // loser matches zero rows and is rejected. The per-USER monthly cap is
    // enforced above via useGraceDay(usedThisMonth, ...).
    const applied = await this.pool.query(
      `UPDATE contracts
       SET ends_at = $1,
           grace_days_used = $4,
           grace_period_month = $5
       WHERE id = $2
         AND grace_days_used = $3
         AND grace_period_month IS NOT DISTINCT FROM $6
       RETURNING grace_days_used`,
      [
        result.newDeadline!.toISOString(),
        contractId,
        storedCount,
        contractUsedThisMonth + 1,
        currentMonth,
        storedMonth,
      ],
    );
    if (applied.rows.length === 0) {
      throw new BadRequestException('Grace day could not be applied (limit reached or concurrent update)');
    }

    // F-AEGIS-09: Prevent strike by marking today's attestation as ATTESTED via Grace Day
    const today = new Date().toISOString().split('T')[0];
    await this.pool.query(
      `UPDATE attestations 
       SET status = 'ATTESTED', attested_at = NOW() 
       WHERE contract_id = $1 AND attestation_date = $2 AND status = 'PENDING'`,
      [contractId, today],
    );

    await this.truthLog.appendEvent('GRACE_DAY_USED', {
      contractId,
      userId,
      previousDeadline: row.ends_at,
      newDeadline: result.newDeadline!.toISOString(),
    });

    return { newDeadline: result.newDeadline! };
  }

  async fileDispute(userId: string, contractId: string) {
    const contract = await this.pool.query(
      'SELECT * FROM contracts WHERE id = $1',
      [contractId],
    );
    if (contract.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }
    await this.assertCanWriteContractRow(contract.rows[0], { userId });

    // Get user's Stripe customer ID for the appeal fee
    const userResult = await this.pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId],
    );
    if (userResult.rows.length === 0 || !userResult.rows[0].stripe_customer_id) {
      throw new BadRequestException('User has no payment method for appeal fee');
    }

    // Get the latest proof for this contract to dispute. An appeal must target a
    // real proof/verdict — never substitute the contractId as a fake proofId, or
    // we would charge the appeal fee against a non-existent proof (and violate the
    // disputes.proof_id FK).
    const proofResult = await this.pool.query(
      `SELECT id FROM proofs WHERE contract_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
      [contractId],
    );
    if (proofResult.rows.length === 0) {
      throw new BadRequestException('No proof exists for this contract to dispute');
    }
    const proofId = proofResult.rows[0].id;

    const result = await this.dispute.initiateAppeal(
      userId,
      proofId,
      userResult.rows[0].stripe_customer_id,
    );

    return result;
  }

  async getContractProofs(contractId: string, requester?: ContractReadRequester) {
    await this.getContract(contractId, requester);

    const result = await this.pool.query(
      `SELECT id, contract_id, user_id, media_uri, status, submitted_at
       FROM proofs WHERE contract_id = $1
       ORDER BY submitted_at DESC`,
      [contractId],
    );
    return result.rows;
  }

  async getUserContracts(userId: string) {
    const result = await this.pool.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM proofs p WHERE p.contract_id = c.id) as proof_count
       FROM contracts c 
       WHERE c.user_id = $1 
       ORDER BY c.created_at DESC`,
      [userId],
    );
    return result.rows.map(row => ({
      ...row,
      proof_count: parseInt(row.proof_count, 10),
    }));
  }

  async getCohortSnapshot(cohortId: string, requesterUserId: string) {
    const requesterRoleResult = await this.pool.query(
      `SELECT role FROM users WHERE id = $1`,
      [requesterUserId],
    );
    const requesterRole = String(requesterRoleResult.rows[0]?.role || 'USER').toUpperCase();

    if (requesterRole !== 'ADMIN') {
      const membership = await this.pool.query(
        `SELECT 1
         FROM contracts
         WHERE user_id = $1
           AND metadata->'cohort'->>'cohortId' = $2
           AND status IN ('PENDING_STAKE', 'ACTIVE', 'COMPLETED', 'FAILED', 'EXEMPT_PENDING', 'EXEMPTED')
         LIMIT 1`,
        [requesterUserId, cohortId],
      );
      if (membership.rows.length === 0) {
        throw new ForbiddenException('Requester is not a participant in this cohort');
      }
    }

    const result = await this.pool.query(
      `WITH latest_contracts AS (
         SELECT DISTINCT ON (c.user_id)
           c.id AS contract_id,
           c.user_id,
           c.status,
           c.created_at,
           c.metadata->'cohort'->>'mode' AS cohort_mode,
           c.metadata->'cohort'->>'podId' AS pod_id,
           c.metadata->'cohort'->>'displayAlias' AS display_alias,
           c.metadata->'cohort'->>'cohortId' AS cohort_id
         FROM contracts c
         WHERE c.metadata->'cohort'->>'cohortId' = $1
         ORDER BY c.user_id, c.created_at DESC
       )
       SELECT
         lc.contract_id,
         lc.user_id,
         lc.status,
         lc.created_at,
         lc.cohort_mode,
         lc.pod_id,
         lc.display_alias,
         lc.cohort_id,
         u.email,
         COALESCE(streak.streak_days, 0) AS streak_days
       FROM latest_contracts lc
       JOIN users u ON u.id = lc.user_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS streak_days
         FROM (
           SELECT
             a.attestation_date,
             ROW_NUMBER() OVER (ORDER BY a.attestation_date DESC) -
             (a.attestation_date - CURRENT_DATE)::int AS grp
           FROM attestations a
           WHERE a.contract_id = lc.contract_id
             AND a.status IN ('ATTESTED', 'COSIGNED')
           ORDER BY a.attestation_date DESC
         ) streak_rows
         WHERE streak_rows.grp = 1
       ) streak ON TRUE
       ORDER BY lc.created_at DESC`,
      [cohortId],
    );

    const participants = result.rows.map((row: any) => {
      const status = row.status === 'ACTIVE' ? 'ACTIVE' : 'OUT';
      return {
        userId: row.user_id,
        alias: this.deriveCohortAlias(row.email, row.display_alias),
        status,
        streakDays: Number(row.streak_days || 0),
        podId: row.pod_id || null,
        mode: row.cohort_mode || null,
        isRequester: row.user_id === requesterUserId,
      };
    });

    const podMap = new Map<string, { podId: string; activeCount: number; outCount: number; members: any[] }>();
    for (const participant of participants) {
      if (!participant.podId) continue;
      if (!podMap.has(participant.podId)) {
        podMap.set(participant.podId, {
          podId: participant.podId,
          activeCount: 0,
          outCount: 0,
          members: [],
        });
      }

      const pod = podMap.get(participant.podId)!;
      pod.members.push({
        alias: participant.alias,
        status: participant.status,
        streakDays: participant.streakDays,
        isRequester: participant.isRequester,
      });
      if (participant.status === 'ACTIVE') {
        pod.activeCount += 1;
      } else {
        pod.outCount += 1;
      }
    }

    const activeCount = participants.filter((p) => p.status === 'ACTIVE').length;
    const outCount = participants.length - activeCount;

    return {
      cohortId,
      participantCount: participants.length,
      activeCount,
      outCount,
      pods: Array.from(podMap.values()),
      participants,
      generatedAt: new Date().toISOString(),
    };
  }

  // ===== Attestation Flow (Recovery Stream) =====

  async getAttestationStatus(contractId: string, userId: string) {
    const contract = await this.pool.query(
      `SELECT id, user_id, oath_category, status, duration_days, started_at, ends_at, strikes, grace_days_used, grace_period_month
       FROM contracts WHERE id = $1`,
      [contractId],
    );

    if (contract.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    const c = contract.rows[0];
    if (c.user_id !== userId) {
      throw new ForbiddenException('You do not own this contract');
    }

    if (!String(c.oath_category || '').startsWith('RECOVERY_')) {
      throw new BadRequestException('Attestation is only available for Recovery stream contracts');
    }

    // Get streak: count consecutive ATTESTED/COSIGNED days ending at today
    const streakResult = await this.pool.query(
      `SELECT COUNT(*) as streak FROM (
         SELECT attestation_date, status,
                ROW_NUMBER() OVER (ORDER BY attestation_date DESC) -
                (attestation_date - CURRENT_DATE)::int as grp
         FROM attestations
         WHERE contract_id = $1 AND status IN ('ATTESTED', 'COSIGNED')
         ORDER BY attestation_date DESC
       ) sub WHERE grp = 1`,
      [contractId],
    );
    const streakDays = parseInt(streakResult.rows[0]?.streak || '0', 10);

    // Check if today has been attested
    const todayResult = await this.pool.query(
      `SELECT status FROM attestations
       WHERE contract_id = $1 AND attestation_date = CURRENT_DATE`,
      [contractId],
    );
    const todayAttested = todayResult.rows.length > 0 &&
      ['ATTESTED', 'COSIGNED'].includes(todayResult.rows[0].status);

    // Calculate days remaining
    const endsAt = c.ends_at ? new Date(c.ends_at) : null;
    const now = new Date();
    const daysRemaining = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0;

    // Grace days available this month. Mirror useGraceDay's month-rollover logic:
    // grace_days_used only counts toward the cap when it belongs to the calendar
    // month recorded in grace_period_month. After a month rollover the stored
    // marker no longer matches, so the quota has logically reset to full — report
    // it that way so status and enforcement agree (LC1). The cap itself is now
    // enforced per-user-per-month (see useGraceDay/LC2); this per-contract view is
    // an upper bound on what this contract has consumed this month.
    const currentMonth = this.currentGraceMonth();
    const usedThisMonth =
      (c.grace_period_month ?? null) === currentMonth ? Number(c.grace_days_used || 0) : 0;
    const graceDaysAvailable = Math.max(0, MAX_GRACE_DAYS_PER_MONTH - usedThisMonth);

    return {
      contractId: c.id,
      oathCategory: c.oath_category,
      streakDays: streakDays,
      daysRemaining: daysRemaining,
      graceDaysAvailable: graceDaysAvailable,
      todayAttested: todayAttested,
      totalStrikes: c.strikes || 0,
    };
  }

  async submitAttestation(contractId: string, userId: string) {
    const contract = await this.pool.query(
      `SELECT id, user_id, oath_category, status
       FROM contracts WHERE id = $1`,
      [contractId],
    );

    if (contract.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    const c = contract.rows[0];
    if (c.user_id !== userId) {
      throw new ForbiddenException('You do not own this contract');
    }

    if (c.status !== 'ACTIVE') {
      throw new BadRequestException('Contract is not active');
    }

    if (!String(c.oath_category || '').startsWith('RECOVERY_')) {
      throw new BadRequestException('Attestation is only available for Recovery stream contracts');
    }

    // Check if already attested today
    const existing = await this.pool.query(
      `SELECT id, status FROM attestations
       WHERE contract_id = $1 AND attestation_date = CURRENT_DATE`,
      [contractId],
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (['ATTESTED', 'COSIGNED'].includes(row.status)) {
        throw new BadRequestException('Already attested today');
      }
      // Update the PENDING row to ATTESTED
      await this.pool.query(
        `UPDATE attestations SET status = 'ATTESTED', attested_at = NOW()
         WHERE id = $1`,
        [row.id],
      );
    } else {
      // Create and immediately attest (scheduler hasn't run yet today).
      // Guard the upsert so a racing COSIGNED row is never downgraded back to
      // ATTESTED: only overwrite when the existing row is not already a more
      // advanced state (COSIGNED/ATTESTED).
      await this.pool.query(
        `INSERT INTO attestations (contract_id, user_id, attestation_date, status, attested_at)
         VALUES ($1, $2, CURRENT_DATE, 'ATTESTED', NOW())
         ON CONFLICT (contract_id, attestation_date) DO UPDATE SET status = 'ATTESTED', attested_at = NOW()
         WHERE attestations.status NOT IN ('ATTESTED', 'COSIGNED')`,
        [contractId, userId],
      );
    }

    // Log to truth log
    await this.truthLog.appendEvent('ATTESTATION_SUBMITTED', {
      contractId,
      userId,
      date: new Date().toISOString().split('T')[0],
    });

    // Notify accountability partner (non-critical)
    try {
      const partners = await this.pool.query(
        `SELECT partner_user_id FROM accountability_partners
         WHERE contract_id = $1 AND status = 'ACTIVE' AND partner_user_id IS NOT NULL`,
        [contractId],
      );

      for (const partner of partners.rows) {
        await this.notifications?.create({
          userId: partner.partner_user_id,
          type: 'PARTNER_ATTESTATION',
          title: 'Partner Check-In',
          body: 'Your accountability partner has submitted their daily attestation and is requesting your co-sign.',
          metadata: { contractId },
        });
      }
    } catch {
      // Notification failure must never abort attestation
    }

    return { status: 'attested' };
  }

  async submitWhoopScoredState(contractId: string, dto: SubmitWhoopScoredInput): Promise<{
    status: 'recorded' | 'ignored';
    state: WhoopScoredState;
    attestationApplied: boolean;
  }> {
    const contract = await this.pool.query(
      `SELECT id, user_id, oath_category, status
       FROM contracts WHERE id = $1`,
      [contractId],
    );

    if (contract.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    const c = contract.rows[0];
    if (c.user_id !== dto.userId) {
      throw new ForbiddenException('You do not own this contract');
    }

    if (c.status !== 'ACTIVE') {
      throw new BadRequestException('Contract is not active');
    }

    if (!String(c.oath_category || '').startsWith('RECOVERY_')) {
      throw new BadRequestException('Whoop SCORED ingestion is only available for Recovery stream contracts');
    }

    const state = String(dto.state || '').toUpperCase() as WhoopScoredState;
    if (state !== WhoopScoredState.SCORED) {
      await this.truthLog.appendEvent('WHOOP_STATE_IGNORED', {
        contractId,
        userId: dto.userId,
        state,
        source: dto.source || 'whoop-webhook',
        recordedAt: dto.recordedAt || new Date().toISOString(),
      });
      return {
        status: 'ignored',
        state,
        attestationApplied: false,
      };
    }

    let attestationApplied = false;
    try {
      await this.submitAttestation(contractId, dto.userId);
      attestationApplied = true;
    } catch (err) {
      if (err instanceof BadRequestException && /Already attested today/i.test(err.message)) {
        attestationApplied = false;
      } else {
        throw err;
      }
    }

    await this.truthLog.appendEvent('WHOOP_SCORED_STATE_RECEIVED', {
      contractId,
      userId: dto.userId,
      state,
      source: dto.source || 'whoop-webhook',
      recordedAt: dto.recordedAt || new Date().toISOString(),
      attestationApplied,
    });

    return {
      status: 'recorded',
      state,
      attestationApplied,
    };
  }

  async getPendingInvitations(userId: string) {
    const result = await this.pool.query(
      `SELECT ap.*, c.oath_category, c.stake_amount, u.email as owner_email
       FROM accountability_partners ap
       JOIN contracts c ON ap.contract_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE (ap.partner_user_id = $1 OR ap.partner_email = (SELECT email FROM users WHERE id = $1))
         AND ap.status = 'PENDING'`,
      [userId],
    );
    return result.rows;
  }

  async acceptPartnerInvitation(contractId: string, partnerUserId: string) {
    const result = await this.pool.query(
      `UPDATE accountability_partners
       SET status = 'ACTIVE', accepted_at = NOW(), partner_user_id = $2
       WHERE contract_id = $1 AND (partner_user_id = $2 OR partner_email = (SELECT email FROM users WHERE id = $2))
       RETURNING id`,
      [contractId, partnerUserId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Invitation not found or already accepted');
    }

    await this.truthLog.appendEvent('PARTNER_INVITATION_ACCEPTED', {
      contractId,
      partnerUserId,
    });

    return { status: 'active' };
  }

  async cosignAttestation(contractId: string, partnerUserId: string) {
    const partnerCheck = await this.pool.query(
      `SELECT 1 FROM accountability_partners
       WHERE contract_id = $1 AND partner_user_id = $2 AND status = 'ACTIVE'`,
      [contractId, partnerUserId],
    );

    if (partnerCheck.rows.length === 0) {
      throw new ForbiddenException('You are not an active accountability partner for this contract');
    }

    const attestation = await this.pool.query(
      `SELECT id FROM attestations
       WHERE contract_id = $1 AND status = 'ATTESTED'
       ORDER BY attestation_date DESC LIMIT 1`,
      [contractId],
    );

    if (attestation.rows.length === 0) {
      throw new BadRequestException('No pending attestation found to co-sign');
    }

    const attestationId = attestation.rows[0].id;

    await this.pool.query(
      `UPDATE attestations
       SET status = 'COSIGNED', cosigned_by = $2, cosigned_at = NOW()
       WHERE id = $1`,
      [attestationId, partnerUserId],
    );

    await this.truthLog.appendEvent('ATTESTATION_COSIGNED', {
      attestationId,
      contractId,
      partnerUserId,
    });

    return { status: 'cosigned' };
  }

  async processHealthKitSample(userId: string, sample: { type: string; value: number; startDate: string; endDate: string }) {
    const streamMap: Record<string, string> = {
      'HKQuantityTypeIdentifierBodyMass': 'BIOLOGICAL_WEIGHT',
      'HKQuantityTypeIdentifierStepCount': 'BIOLOGICAL_CARDIO',
      'HKCategoryTypeIdentifierSleepAnalysis': 'BIOLOGICAL_SLEEP',
    };
    
    const targetCategory = streamMap[sample.type];
    if (!targetCategory) return;

    const activeContracts = await this.pool.query(
      `SELECT id FROM contracts
       WHERE user_id = $1 AND status = 'ACTIVE'
         AND oath_category = $2
         AND verification_method = 'HEALTHKIT'`,
      [userId, targetCategory]
    );

    for (const contract of activeContracts.rows) {
      try {
        await this.submitAttestation(contract.id, userId);
        this.logger.log(`Auto-attested contract ${contract.id} via HealthKit sample ${sample.type}`);
      } catch (err) {
        if (!(err instanceof BadRequestException && /Already attested today/i.test(err.message))) {
          this.logger.error(`Failed to auto-attest contract ${contract.id}: ${err}`);
        }
      }
    }
  }

  async doubleDownStake(contractId: string, userId: string, additionalAmount: number) {
    // Defence-in-depth: the controller DTO already rejects non-positive / NaN /
    // oversized values, but the service must not trust its caller for money.
    if (!Number.isFinite(additionalAmount) || additionalAmount <= 0) {
      throw new BadRequestException('Additional stake amount must be a positive number');
    }
    const additionalAmountCents = toCents(additionalAmount);
    if (!Number.isInteger(additionalAmountCents) || additionalAmountCents <= 0) {
      throw new BadRequestException('Additional stake amount resolves to an invalid cent value');
    }

    const contract = await this.pool.query('SELECT * FROM contracts WHERE id = $1', [contractId]);
    if (contract.rows.length === 0) throw new NotFoundException('Contract not found');
    const row = contract.rows[0];

    if (row.user_id !== userId) throw new ForbiddenException('Not your contract');
    if (row.status !== 'ACTIVE') throw new BadRequestException('Contract is not active');

    const userResult = await this.pool.query('SELECT stripe_customer_id, account_id FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user.stripe_customer_id) throw new BadRequestException('No payment method on file');

    // 1. Hold additional funds via Stripe BEFORE the DB mutation so a Stripe
    //    failure can't leave the ledger ahead of the actual hold. The hold is
    //    the only step that lives outside the DB transaction; if the
    //    transaction below fails we compensate by cancelling the hold so funds
    //    are never authorized without a matching ledger record.
    const paymentIntent = await this.stripe.holdStake(user.stripe_customer_id, additionalAmountCents, contractId);

    const ledgerSideEffectKey = `double-down:${contractId}:${paymentIntent.id}`;

    // 2. Apply the DB mutations atomically with a row lock so concurrent
    //    double-down requests (or retries) can't race on stake_amount.
    const maybeConnect = (this.pool as unknown as { connect?: () => Promise<PoolClient> }).connect;
    const client = typeof maybeConnect === 'function' ? await maybeConnect.call(this.pool) : null;
    const db: { query: PoolClient['query'] } = (client ?? this.pool) as any;
    const useTransaction = !!client;

    let newTotal: number;
    try {
      if (useTransaction) {
        await db.query('BEGIN');

        // Re-read under FOR UPDATE to obtain the authoritative stake amount and
        // guard the status while the row is locked.
        const locked = await db.query(
          'SELECT id, user_id, status, stake_amount, metadata FROM contracts WHERE id = $1 FOR UPDATE',
          [contractId],
        );
        if (locked.rows.length === 0) throw new NotFoundException('Contract not found');
        const lockedRow = locked.rows[0];
        if (lockedRow.user_id !== userId) throw new ForbiddenException('Not your contract');
        if (lockedRow.status !== 'ACTIVE') throw new BadRequestException('Contract is not active');

        // Idempotency guard: if this payment intent was already recorded for this
        // contract, the double-down already applied — do not double-count.
        const alreadyApplied = await db.query(
          `SELECT id FROM contracts
           WHERE id = $1
             AND metadata->'additional_payouts' @> $2::jsonb`,
          [contractId, JSON.stringify([paymentIntent.id])],
        );
        if (alreadyApplied.rows.length > 0) {
          await db.query('COMMIT');
          return {
            contractId,
            newTotal: Number(lockedRow.stake_amount),
            paymentIntentId: paymentIntent.id,
          };
        }

        newTotal = Number(lockedRow.stake_amount) + additionalAmount;
        await db.query(
          `UPDATE contracts
           SET stake_amount = $1,
               metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{additional_payouts}',
                                   COALESCE(metadata->'additional_payouts', '[]'::jsonb) || $3::jsonb)
           WHERE id = $2`,
          [newTotal, contractId, JSON.stringify([paymentIntent.id])],
        );

        // Ledger entry for the increase, inside the same transaction. The
        // sideEffectKey makes the posting idempotent on retry.
        const escrowResult = await db.query(`SELECT id FROM accounts WHERE name = 'SYSTEM_ESCROW' LIMIT 1`);
        if (user.account_id && escrowResult.rows.length > 0) {
          await this.ledger.recordTransaction(
            user.account_id,
            escrowResult.rows[0].id,
            additionalAmountCents,
            contractId,
            { type: 'STAKE_DOUBLE_DOWN', previousTotal: lockedRow.stake_amount, sideEffectKey: ledgerSideEffectKey },
            client as PoolClient,
          );
        }

        await db.query('COMMIT');
      } else {
        // Non-transactional fallback (e.g. unit tests / pools without connect()).
        newTotal = Number(row.stake_amount) + additionalAmount;
        await db.query(
          `UPDATE contracts
           SET stake_amount = $1,
               metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{additional_payouts}',
                                   COALESCE(metadata->'additional_payouts', '[]'::jsonb) || $3::jsonb)
           WHERE id = $2`,
          [newTotal, contractId, JSON.stringify([paymentIntent.id])],
        );

        const escrowResult = await db.query(`SELECT id FROM accounts WHERE name = 'SYSTEM_ESCROW' LIMIT 1`);
        if (user.account_id && escrowResult.rows.length > 0) {
          await this.ledger.recordTransaction(
            user.account_id,
            escrowResult.rows[0].id,
            additionalAmountCents,
            contractId,
            { type: 'STAKE_DOUBLE_DOWN', previousTotal: row.stake_amount, sideEffectKey: ledgerSideEffectKey },
          );
        }
      }
    } catch (err) {
      if (useTransaction) {
        try {
          await db.query('ROLLBACK');
        } catch {
          // Preserve original failure.
        }
      }
      // Compensation: the Stripe hold succeeded but the ledger/contract mutation
      // failed, so cancel the hold to avoid funds authorized without a record.
      try {
        await this.stripe.cancelHold(paymentIntent.id);
      } catch (cancelErr) {
        this.logger.error(
          `Double-down compensation failed for contract ${contractId}, orphaned hold ${paymentIntent.id}: ${
            cancelErr instanceof Error ? cancelErr.message : cancelErr
          }`,
        );
      }
      throw err;
    } finally {
      client?.release();
    }

    // 4. Audit Log (non-financial; outside the transaction)
    await this.truthLog.appendEvent('STAKE_DOUBLED_DOWN', {
      contractId,
      userId,
      additionalAmount,
      newTotal,
      paymentIntentId: paymentIntent.id,
    });

    return { contractId, newTotal, paymentIntentId: paymentIntent.id };
  }

  // --- Phase Delta: Recovery Timelocks (TKT-P1-005) ---

  async getRecoveryLockStatus(contractId: string, userId: string) {
    const contract = await this.pool.query("SELECT status, user_id FROM contracts WHERE id = \$1", [contractId]);
    if (contract.rows.length === 0 || contract.rows[0].user_id !== userId) throw new NotFoundException("Contract not found");

    const result = await this.pool.query(
      "SELECT * FROM recovery_break_requests WHERE contract_id = \$1 ORDER BY requested_at DESC LIMIT 1",
      [contractId]
    );
    
    if (result.rows.length === 0) return { activeRequest: null };
    
    const req = result.rows[0];
    const now = new Date();
    const unlockAt = new Date(req.unlock_at);
    
    if (req.status === "PENDING_COOLDOWN" && now >= unlockAt) {
      return { activeRequest: { ...req, status: "UNLOCKED" } };
    }
    return { activeRequest: req };
  }

  async requestRecoveryBreak(contractId: string, userId: string, reason: string) {
    const contract = await this.pool.query(
      "SELECT id, status, user_id FROM contracts WHERE id = \$1 AND user_id = \$2",
      [contractId, userId]
    );
    if (contract.rows.length === 0) throw new NotFoundException("Contract not found");
    if (contract.rows[0].status !== "ACTIVE") throw new BadRequestException("Contract must be active");

    const existing = await this.pool.query(
      "SELECT id FROM recovery_break_requests WHERE contract_id = \$1 AND status = 'PENDING_COOLDOWN'",
      [contractId]
    );
    if (existing.rows.length > 0) throw new ConflictException("A break request is already in cooldown");

    const unlockAt = new Date();
    unlockAt.setHours(unlockAt.getHours() + 24);

    const result = await this.pool.query(
      "INSERT INTO recovery_break_requests (contract_id, unlock_at, reason, status) VALUES (\$1, \$2, \$3, 'PENDING_COOLDOWN' ) RETURNING *",
      [contractId, unlockAt.toISOString(), reason]
    );

    await this.truthLog.appendEvent("RECOVERY_BREAK_REQUESTED", {
      contractId,
      userId,
      unlockAt: unlockAt.toISOString(),
      reason
    });

    return result.rows[0];
  }

  async cancelRecoveryBreak(contractId: string, userId: string) {
    const contract = await this.pool.query(
      "SELECT id FROM contracts WHERE id = \$1 AND user_id = \$2",
      [contractId, userId]
    );
    if (contract.rows.length === 0) throw new NotFoundException("Contract not found");

    const result = await this.pool.query(
      "UPDATE recovery_break_requests SET status = 'CANCELLED' WHERE contract_id = \$1 AND status = 'PENDING_COOLDOWN' RETURNING *",
      [contractId]
    );

    if (result.rows.length === 0) throw new BadRequestException("No pending cooldown to cancel");

    await this.truthLog.appendEvent("RECOVERY_BREAK_CANCELLED", {
      contractId,
      userId,
    });

    return { success: true, request: result.rows[0] };
  }

  // --- Phase Delta: Accountability Partners (TKT-P1-017) ---

  async invitePartner(contractId: string, userId: string, partnerEmail: string) {
    // Ownership check: only the contract owner (or an authorized writer) may
    // invite accountability partners to a contract.
    const contract = await this.pool.query("SELECT * FROM contracts WHERE id = \$1", [contractId]);
    if (contract.rows.length === 0) throw new NotFoundException("Contract not found");
    await this.assertCanWriteContractRow(contract.rows[0], { userId });

    const partner = await this.pool.query("SELECT id FROM users WHERE email = \$1", [partnerEmail]);
    if (partner.rows.length === 0) throw new NotFoundException("Partner user not found");
    const partnerId = partner.rows[0].id;

    await this.pool.query(
      "INSERT INTO accountability_partners (contract_id, partner_user_id, status) VALUES (\$1, \$2, 'PENDING' ) ON CONFLICT DO NOTHING",
      [contractId, partnerId]
    );

    await this.pool.query(
      "INSERT INTO accountability_partner_events (contract_id, actor_id, event_type, payload) VALUES (\$1, \$2, 'INVITE_SENT', \$3)",
      [contractId, userId, JSON.stringify({ partnerId })]
    );

    return { success: true, partnerId };
  }

  async respondToInvite(contractId: string, partnerId: string, accept: boolean) {
    const status = accept ? "ACTIVE" : "DECLINED";
    const result = await this.pool.query(
      "UPDATE accountability_partners SET status = \$1 WHERE contract_id = \$2 AND partner_user_id = \$3 RETURNING *",
      [status, contractId, partnerId]
    );

    if (result.rows.length === 0) throw new NotFoundException("Invitation not found");

    await this.pool.query(
      "INSERT INTO accountability_partner_events (contract_id, actor_id, event_type) VALUES (\$1, \$2, \$3)",
      [contractId, partnerId, accept ? "INVITE_ACCEPTED" : "INVITE_DECLINED"]
    );

    return { success: true, status };
  }

  async vetoRecoveryBreak(contractId: string, partnerId: string) {
    const partner = await this.pool.query(
      "SELECT id FROM accountability_partners WHERE contract_id = \$1 AND partner_user_id = \$2 AND status = 'ACTIVE'",
      [contractId, partnerId]
    );
    if (partner.rows.length === 0) throw new ForbiddenException("Only active accountability partners can veto");

    await this.pool.query(
      "UPDATE recovery_break_requests SET status = 'CANCELLED' WHERE contract_id = \$1 AND status = 'PENDING_COOLDOWN'",
      [contractId]
    );

    await this.pool.query(
      "INSERT INTO accountability_partner_events (contract_id, actor_id, event_type) VALUES (\$1, \$2, 'VETO_TRIGGERED')",
      [contractId, partnerId]
    );

    return { success: true, message: "Recovery break vetoed by partner" };
  }

  async getAccountabilityStatus(contractId: string, userId: string) {
    const partners = await this.pool.query(
      "SELECT u.email, ap.status, ap.partner_user_id FROM accountability_partners ap JOIN users u ON ap.partner_user_id = u.id WHERE ap.contract_id = \$1",
      [contractId]
    );
    const events = await this.pool.query(
      "SELECT * FROM accountability_partner_events WHERE contract_id = \$1 ORDER BY created_at DESC",
      [contractId]
    );
    return { partners: partners.rows, history: events.rows };
  }

  // --- Phase Delta: Weekend Multipliers (TKT-P1-012) ---

  async getRecoveryPenaltyPreview(contractId: string, userId: string) {
    const contract = await this.pool.query(
      "SELECT stake_amount, started_at, oath_category FROM contracts WHERE id = $1 AND user_id = $2",
      [contractId, userId]
    );
    if (contract.rows.length === 0) throw new NotFoundException("Contract not found");

    const row = contract.rows[0];
    const stakeAmount = parseFloat(row.stake_amount);
    
    // Only RECOVERY stream contracts use the dynamic state machine
    if (!String(row.oath_category || '').startsWith('RECOVERY_')) {
      return {
        basePenaltyUsd: stakeAmount,
        multiplier: 1.0,
        effectivePenaltyUsd: stakeAmount,
        riskWindow: "NORMAL",
      };
    }

    const startedAt = row.started_at ? new Date(row.started_at) : new Date();
    const penaltyState = this.dynamicPenalty.calculateState(startedAt);

    return {
      basePenaltyUsd: stakeAmount,
      multiplier: penaltyState.multiplier,
      effectivePenaltyUsd: stakeAmount * penaltyState.multiplier,
      riskWindow: penaltyState.state,
      description: penaltyState.description,
      delayHrs: penaltyState.delayHrs,
      refundPct: penaltyState.refundPct,
    };
  }
}
