import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Optional, Inject, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { DisputeService } from '../../../services/escrow/dispute.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { AegisProtocolService } from '../../../services/health/aegis.service';
import { RecoveryProtocolService } from '../../../services/health/recovery-protocol.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { NotificationsService } from '../notifications/notifications.service';
import { calculateIntegrity, getAllowedTiers, getTierMaxStake, UserHistory } from '../../../../shared/libs/integrity';
import {
  OathCategory,
  VerificationMethod,
  validateOathMapping,
  grantOnboardingBonus,
  useGraceDay,
  ONBOARDING_BONUS_AMOUNT,
  FAILURE_COOL_OFF_DAYS,
  DOWNSCALE_STRIKE_THRESHOLD,
  MAX_NOCONTACT_DURATION_DAYS,
} from '../../../../shared/libs/behavioral-logic';

import { CreateContractDto as CreateContractDtoBase, SubmitProofDto as SubmitProofDtoBase } from './dto';

export interface CreateContractInput extends CreateContractDtoBase {
  userId: string;
}

export interface SubmitProofInput extends SubmitProofDtoBase {
  userId: string;
}

export interface ContractReadRequester {
  userId: string;
}

type ContractResolutionSideEffectType =
  | 'STRIPE_CANCEL_HOLD'
  | 'STRIPE_CAPTURE_STAKE'
  | 'LEDGER_STAKE_RETURN'
  | 'LEDGER_STAKE_CAPTURE'
  | 'TRUTH_CONTRACT_RESOLVED'
  | 'NOTIFY_CONTRACT_RESOLVED';

interface ContractResolutionSideEffectRow {
  id: string;
  contract_id: string;
  outcome: 'COMPLETED' | 'FAILED';
  effect_type: ContractResolutionSideEffectType;
  dedupe_key: string;
  payload: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  attempts: number;
}

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private readonly pool: Pool,
    private readonly ledger: LedgerService,
    private readonly truthLog: TruthLogService,
    private readonly stripe: StripeFboService,
    private readonly dispute: DisputeService,
    private readonly furyRouter: FuryRouterService,
    private readonly aegis: AegisProtocolService,
    private readonly recovery: RecoveryProtocolService,
    private readonly anomaly: AnomalyService,
    @Optional() @Inject(NotificationsService) private readonly notifications?: NotificationsService,
  ) {}

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
  }): Array<{
    contractId: string;
    outcome: 'COMPLETED' | 'FAILED';
    effectType: ContractResolutionSideEffectType;
    dedupeKey: string;
    payload: Record<string, any>;
  }> {
    const { contractId, outcome, contractRow, userRow, escrowAccountId, revenueAccountId } = input;
    const effects: Array<{
      contractId: string;
      outcome: 'COMPLETED' | 'FAILED';
      effectType: ContractResolutionSideEffectType;
      dedupeKey: string;
      payload: Record<string, any>;
    }> = [];
    const baseKey = `contract-resolution:${contractId}:${outcome}`;

    if (contractRow.payment_intent_id) {
      effects.push({
        contractId,
        outcome,
        effectType: outcome === 'COMPLETED' ? 'STRIPE_CANCEL_HOLD' : 'STRIPE_CAPTURE_STAKE',
        dedupeKey: `${baseKey}:stripe`,
        payload: {
          paymentIntentId: contractRow.payment_intent_id,
        },
      });
    }

    if (userRow?.account_id && escrowAccountId) {
      if (outcome === 'COMPLETED') {
        effects.push({
          contractId,
          outcome,
          effectType: 'LEDGER_STAKE_RETURN',
          dedupeKey: `${baseKey}:ledger:return`,
          payload: {
            debitAccountId: escrowAccountId,
            creditAccountId: userRow.account_id,
            amount: Number(contractRow.stake_amount),
            metadata: {
              type: 'STAKE_RETURN',
              outcome,
              sideEffectKey: `${baseKey}:ledger:return`,
            },
          },
        });
      } else if (revenueAccountId) {
        effects.push({
          contractId,
          outcome,
          effectType: 'LEDGER_STAKE_CAPTURE',
          dedupeKey: `${baseKey}:ledger:capture`,
          payload: {
            debitAccountId: escrowAccountId,
            creditAccountId: revenueAccountId,
            amount: Number(contractRow.stake_amount),
            metadata: {
              type: 'STAKE_CAPTURED',
              outcome,
              sideEffectKey: `${baseKey}:ledger:capture`,
            },
          },
        });
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
          : `Your contract has failed. $${Number(contractRow.stake_amount).toFixed(2)} has been captured.`,
        metadata: {
          contractId,
          outcome,
          sideEffectKey: `${baseKey}:notification`,
        },
      },
    });

    return effects;
  }

  private async drainContractResolutionSideEffects(
    contractId: string,
    outcome: 'COMPLETED' | 'FAILED',
  ): Promise<void> {
    const pending = await this.pool.query(
      `SELECT id, contract_id, outcome, effect_type, dedupe_key, payload, status, attempts
       FROM contract_resolution_side_effects
       WHERE contract_id = $1 AND outcome = $2 AND status != 'COMPLETED'
       ORDER BY created_at ASC`,
      [contractId, outcome],
    );

    for (const row of pending.rows as ContractResolutionSideEffectRow[]) {
      const claimed = await this.pool.query(
        `UPDATE contract_resolution_side_effects
         SET status = 'PROCESSING', attempts = attempts + 1, locked_at = NOW(), last_error = NULL
         WHERE id = $1 AND status IN ('PENDING', 'FAILED')
         RETURNING id, contract_id, outcome, effect_type, dedupe_key, payload, status, attempts`,
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
           SET status = 'COMPLETED', processed_at = NOW(), last_error = NULL
           WHERE id = $1`,
          [effect.id],
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await this.pool.query(
          `UPDATE contract_resolution_side_effects
           SET status = 'FAILED', last_error = $2
           WHERE id = $1`,
          [effect.id, message.slice(0, 2000)],
        );
        throw err;
      }
    }
  }

  async sweepFailedContractResolutionSideEffects(limit = 25): Promise<{
    staleResetCount: number;
    groupsFound: number;
    groupsRetried: number;
    groupsFailed: number;
  }> {
    const staleResetResult = await this.pool.query(
      `UPDATE contract_resolution_side_effects
       SET status = 'FAILED',
           last_error = COALESCE(last_error, 'Stale PROCESSING lease expired before completion')
       WHERE status = 'PROCESSING'
         AND locked_at IS NOT NULL
         AND locked_at < NOW() - INTERVAL '10 minutes'
       RETURNING id`,
    );

    const groups = await this.pool.query(
      `SELECT contract_id, outcome
       FROM contract_resolution_side_effects
       WHERE status = 'FAILED'
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

    return {
      staleResetCount: staleResetResult.rows.length,
      groupsFound: groups.rows.length,
      groupsRetried,
      groupsFailed,
    };
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
      case 'LEDGER_STAKE_RETURN':
      case 'LEDGER_STAKE_CAPTURE': {
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

  async createContract(dto: CreateContractInput): Promise<{ contractId: string; paymentIntentId: string; bountyLink?: string }> {
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

    // 3. Validate stake amount against integrity tier
    const tiers = getAllowedTiers(user.integrity_score);
    if (tiers[0] === 'RESTRICTED_MODE') {
      throw new ForbiddenException('Integrity score too low — account is in restricted mode');
    }

    // 3b. Stake tier limit
    const tierMax = getTierMaxStake(tiers);
    if (dto.stakeAmount > tierMax) {
      throw new BadRequestException(
        `Stake amount $${dto.stakeAmount} exceeds tier limit of $${tierMax}`,
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
      if (dto.stakeAmount > maxStake) {
        throw new BadRequestException(
          `Dynamic downscaling: max stake is $${maxStake.toFixed(2)} after ${failCount} failures`,
        );
      }
    }

    // 3. Aegis Protocol Verification (Psychological / Financial Guardrails)
    this.aegis.validatePsychologicalGuardrails(
      dto.stakeAmount,
      dto.durationDays,
      user.integrity_score,
      totalFailures.rows[0].count
    );

    // 4b. If recovery oath, run Recovery Protocol guardrails
    if (dto.oathCategory.startsWith('RECOVERY_')) {
      this.recovery.validateRecoveryContract(
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

    const paymentIntent = await this.stripe.holdStake(
      user.stripe_customer_id,
      dto.stakeAmount,
      'pending', // temporary — will update with contract ID
    );

    // 6. Insert contract row
    const now = new Date();
    const endsAt = new Date(now.getTime() + dto.durationDays * 24 * 60 * 60 * 1000);
    const contractMetadata = dto.recoveryMetadata
      ? { recovery: { noContactIdentifiers: dto.recoveryMetadata.noContactIdentifiers, acknowledgments: dto.recoveryMetadata.acknowledgments } }
      : {};

    const contractResult = await this.pool.query(
      `INSERT INTO contracts (user_id, oath_category, verification_method, stake_amount, payment_intent_id, duration_days, status, started_at, ends_at, metadata, bounty_link_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, $8, $9, $10)
       RETURNING id`,
      [dto.userId, dto.oathCategory, dto.verificationMethod, dto.stakeAmount, paymentIntent.id, dto.durationDays, now.toISOString(), endsAt.toISOString(), JSON.stringify(contractMetadata), bountyLinkId],
    );
    const contractId = contractResult.rows[0].id;

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
          dto.stakeAmount,
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

    const response: { contractId: string; paymentIntentId: string; bountyLink?: string } = {
      contractId,
      paymentIntentId: paymentIntent.id
    };

    if (bountyLinkId) {
      const publicWebUrl = process.env.STYX_WEB_PUBLIC_URL || 'http://localhost:3001';
      response.bountyLink = `${publicWebUrl}/whistleblower/${bountyLinkId}`;
    }

    return response;
  }

  async getContract(contractId: string, requester?: ContractReadRequester) {
    const result = await this.pool.query(
      `SELECT c.*, u.email, u.integrity_score
       FROM contracts c JOIN users u ON c.user_id = u.id
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
    return row;
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

    // 2. Mark bounty as pending review (claimed)
    await this.pool.query(
      `UPDATE bounties SET status = 'CLAIMED', claimed_at = NOW(), claimant_ip = $1 WHERE id = $2`,
      [claimantIp, bounty.id]
    );

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

      // Update contract status while the row lock is held.
      await db.query(
        'UPDATE contracts SET status = $1 WHERE id = $2',
        [outcome, contractId],
      );

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
        const delta = calculateIntegrity(history) - 50; // offset from base
        const newScore = Math.max(0, user.integrity_score + delta);
        await db.query(
          'UPDATE users SET integrity_score = $1 WHERE id = $2',
          [newScore, user.id],
        );
      }

      if (useTransaction) {
        const escrowResult = await db.query(
          `SELECT id FROM accounts WHERE name = 'SYSTEM_ESCROW' LIMIT 1`,
        );
        const revenueResult = outcome === 'FAILED'
          ? await db.query(`SELECT id FROM accounts WHERE name = 'SYSTEM_REVENUE' LIMIT 1`)
          : { rows: [] as any[] };

        const effects = this.buildContractResolutionSideEffects({
          contractId,
          outcome,
          contractRow: row,
          userRow: userResult.rows[0],
          escrowAccountId: escrowResult.rows[0]?.id ?? null,
          revenueAccountId: revenueResult.rows[0]?.id ?? null,
        });
        await this.enqueueContractResolutionSideEffects(db, effects);
      } else {
        if (outcome === 'COMPLETED') {
          // Release held funds back to user
          if (row.payment_intent_id) {
            await this.stripe.cancelHold(row.payment_intent_id);
          }
        } else {
          // Capture stake — user failed
          if (row.payment_intent_id) {
            await this.stripe.captureStake(row.payment_intent_id);
          }
        }

        // Record in ledger if we have accounts
        if (userResult.rows[0]?.account_id) {
          const escrowResult = await db.query(
            `SELECT id FROM accounts WHERE name = 'SYSTEM_ESCROW' LIMIT 1`,
          );
          if (escrowResult.rows.length > 0) {
            if (outcome === 'COMPLETED') {
              // Return from escrow to user
              await this.ledger.recordTransaction(
                escrowResult.rows[0].id,
                userResult.rows[0].account_id,
                Number(row.stake_amount),
                contractId,
                { type: 'STAKE_RETURN', outcome },
              );
            } else {
              // Move from escrow to revenue
              const revenueResult = await db.query(
                `SELECT id FROM accounts WHERE name = 'SYSTEM_REVENUE' LIMIT 1`,
              );
              if (revenueResult.rows.length > 0) {
                await this.ledger.recordTransaction(
                  escrowResult.rows[0].id,
                  revenueResult.rows[0].id,
                  Number(row.stake_amount),
                  contractId,
                  { type: 'STAKE_CAPTURED', outcome },
                );
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
          : `Your contract has failed. $${Number(row.stake_amount).toFixed(2)} has been captured.`,
        metadata: { contractId, outcome },
      });
    } catch {
      // Notification failure must never abort a successful resolution
    }
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

    // Count grace days used this month for this user
    const graceDaysResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM truth_log
       WHERE event_type = 'GRACE_DAY_USED'
       AND payload->>'userId' = $1
       AND created_at >= date_trunc('month', NOW())`,
      [userId],
    );
    const graceDaysUsed = Number(graceDaysResult.rows[0].count);

    const result = useGraceDay(graceDaysUsed, new Date(row.ends_at));
    if (!result.success) {
      throw new BadRequestException(result.reason);
    }

    // Extend the contract deadline
    await this.pool.query(
      'UPDATE contracts SET ends_at = $1 WHERE id = $2',
      [result.newDeadline!.toISOString(), contractId],
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

    // Get the latest proof for this contract to dispute
    const proofResult = await this.pool.query(
      `SELECT id FROM proofs WHERE contract_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
      [contractId],
    );
    const proofId = proofResult.rows.length > 0 ? proofResult.rows[0].id : contractId;

    const result = await this.dispute.initiateAppeal(
      userId,
      proofId,
      userResult.rows[0].stripe_customer_id,
    );

    await this.truthLog.appendEvent('APPEAL_INITIATED', {
      contractId,
      userId,
      proofId,
      paymentIntentId: result.paymentIntentId,
    });

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
      `SELECT * FROM contracts WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows;
  }
}
