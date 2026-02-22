import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { AegisProtocolService } from '../../../services/health/aegis.service';
import { calculateIntegrity, getAllowedTiers, UserHistory } from '../../../../shared/libs/integrity';
import { OathCategory, VerificationMethod } from '../../../../shared/libs/behavioral-logic';

export interface CreateContractDto {
  userId: string;
  oathCategory: string;
  verificationMethod: string;
  stakeAmount: number;
  durationDays: number;
  healthMetrics?: {
    currentWeightLbs: number;
    heightInches: number;
    targetWeightLbs: number;
  };
}

export interface SubmitProofDto {
  userId: string;
  mediaUri: string;
}

@Injectable()
export class ContractsService {
  constructor(
    private readonly pool: Pool,
    private readonly ledger: LedgerService,
    private readonly truthLog: TruthLogService,
    private readonly stripe: StripeFboService,
    private readonly furyRouter: FuryRouterService,
    private readonly aegis: AegisProtocolService,
  ) {}

  async createContract(dto: CreateContractDto): Promise<{ contractId: string; paymentIntentId: string }> {
    // 1. Validate oath category
    const validCategories = Object.values(OathCategory) as string[];
    if (!validCategories.includes(dto.oathCategory)) {
      throw new BadRequestException(`Invalid oath category: ${dto.oathCategory}`);
    }

    const validMethods = Object.values(VerificationMethod) as string[];
    if (!validMethods.includes(dto.verificationMethod)) {
      throw new BadRequestException(`Invalid verification method: ${dto.verificationMethod}`);
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

    // 3. Validate stake amount against integrity tier
    const tiers = getAllowedTiers(user.integrity_score);
    if (tiers[0] === 'RESTRICTED_MODE') {
      throw new ForbiddenException('Integrity score too low — account is in restricted mode');
    }

    // 4. If biological oath, run Aegis medical guardrails
    if (dto.oathCategory.startsWith('BIOLOGICAL_') && dto.healthMetrics) {
      this.aegis.validateHealthMetrics(
        dto.healthMetrics.currentWeightLbs,
        dto.healthMetrics.heightInches,
        dto.healthMetrics.targetWeightLbs,
        dto.durationDays,
      );
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

    const contractResult = await this.pool.query(
      `INSERT INTO contracts (user_id, oath_category, verification_method, stake_amount, payment_intent_id, duration_days, status, started_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, $8)
       RETURNING id`,
      [dto.userId, dto.oathCategory, dto.verificationMethod, dto.stakeAmount, paymentIntent.id, dto.durationDays, now.toISOString(), endsAt.toISOString()],
    );
    const contractId = contractResult.rows[0].id;

    // 7. Record ledger entry (user asset → escrow liability)
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

    // 8. Log to TruthLog
    await this.truthLog.appendEvent('CONTRACT_CREATED', {
      contractId,
      userId: dto.userId,
      oathCategory: dto.oathCategory,
      stakeAmount: dto.stakeAmount,
      durationDays: dto.durationDays,
    });

    return { contractId, paymentIntentId: paymentIntent.id };
  }

  async getContract(contractId: string) {
    const result = await this.pool.query(
      `SELECT c.*, u.email, u.integrity_score
       FROM contracts c JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [contractId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }
    return result.rows[0];
  }

  async submitProof(contractId: string, dto: SubmitProofDto): Promise<{ proofId: string; jobId: string }> {
    // 1. Validate contract ownership and status
    const contract = await this.pool.query(
      'SELECT * FROM contracts WHERE id = $1',
      [contractId],
    );
    if (contract.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }
    if (contract.rows[0].user_id !== dto.userId) {
      throw new ForbiddenException('Cannot submit proof for another user\'s contract');
    }
    if (contract.rows[0].status !== 'ACTIVE') {
      throw new BadRequestException(`Contract is not active (status: ${contract.rows[0].status})`);
    }

    // 2. Insert proof row
    const proofResult = await this.pool.query(
      `INSERT INTO proofs (contract_id, user_id, media_uri, status)
       VALUES ($1, $2, $3, 'PENDING_REVIEW')
       RETURNING id`,
      [contractId, dto.userId, dto.mediaUri],
    );
    const proofId = proofResult.rows[0].id;

    // 3. Route to Fury network via BullMQ
    const jobId = await this.furyRouter.routeProof(proofId, dto.userId, 3);

    // 4. Log to TruthLog
    await this.truthLog.appendEvent('PROOF_SUBMITTED', {
      proofId,
      contractId,
      userId: dto.userId,
    });

    return { proofId, jobId };
  }

  async resolveContract(
    contractId: string,
    outcome: 'COMPLETED' | 'FAILED',
  ): Promise<void> {
    const contract = await this.pool.query(
      'SELECT * FROM contracts WHERE id = $1',
      [contractId],
    );
    if (contract.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    const row = contract.rows[0];

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

    // Update contract status
    await this.pool.query(
      'UPDATE contracts SET status = $1 WHERE id = $2',
      [outcome, contractId],
    );

    // Update user integrity score
    const userResult = await this.pool.query('SELECT * FROM users WHERE id = $1', [row.user_id]);
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
      await this.pool.query(
        'UPDATE users SET integrity_score = $1 WHERE id = $2',
        [newScore, user.id],
      );
    }

    // Record in ledger if we have accounts
    if (userResult.rows[0]?.account_id) {
      const escrowResult = await this.pool.query(
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
          const revenueResult = await this.pool.query(
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

  async getUserContracts(userId: string) {
    const result = await this.pool.query(
      `SELECT * FROM contracts WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows;
  }
}
