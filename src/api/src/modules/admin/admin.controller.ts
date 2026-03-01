import { Controller, Post, Get, Param, Body, UseGuards, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ModerationService } from '../../../services/security/moderation.service';
import { HoneypotService } from '../../../services/intelligence/honeypot.service';
import { ContractsService } from '../contracts/contracts.service';
import { DisputeService } from '../../../services/escrow/dispute.service';
import { R2StorageService } from '../../../services/storage/r2.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { IdentityVerificationService } from '../compliance/identity-verification.service';
import { IdentityVerificationMode } from '../compliance/identity-provider.service';
import { BanUserDto, ResolveContractDto } from './dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AuthGuard, RoleGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly moderation: ModerationService,
    private readonly honeypot: HoneypotService,
    private readonly contractsService: ContractsService,
    private readonly disputeService: DisputeService,
    private readonly r2: R2StorageService,
    private readonly anomaly: AnomalyService,
    private readonly truthLog: TruthLogService,
    private readonly identityVerification: IdentityVerificationService,
    private readonly pool: Pool,
  ) {}

  // --- Integrity ---

  @Get('integrity/chain')
  @ApiOperation({ summary: 'Verify event_log hash chain integrity' })
  async verifyChain() {
    return this.truthLog.verifyChain();
  }

  // --- Honeypot ---

  @Post('honeypot')
  @ApiOperation({ summary: 'Inject a honeypot proof to QA reviewer accuracy' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async injectHoneypot() {
    await this.honeypot.injectHoneypot();
    return { status: 'honeypot_injected' };
  }

  // --- Moderation ---

  @Post('ban/:userId')
  @ApiOperation({ summary: 'Ban a user for policy violations' })
  async banUser(
    @Param('userId') targetUserId: string,
    @CurrentUser() user: { id: string },
    @Body() body: BanUserDto,
  ) {
    return this.moderation.banUser(user.id, targetUserId, body.reason);
  }

  // --- Contracts ---

  @Post('resolve/:contractId')
  @ApiOperation({ summary: 'Manually resolve a contract as completed or failed' })
  async resolveContract(
    @Param('contractId') contractId: string,
    @Body() body: ResolveContractDto,
  ) {
    await this.contractsService.resolveContract(contractId, body.outcome);
    return { status: 'resolved', contractId, outcome: body.outcome };
  }

  // --- Disputes (The Judge's Gavel) ---

  @Get('disputes')
  @ApiOperation({ summary: 'Get queue of disputes pending judge review' })
  async getDisputes() {
    return this.disputeService.getDisputeQueue();
  }

  @Get('disputes/:id')
  @ApiOperation({ summary: 'Get full dispute detail with Fury vote history and signed media URL' })
  async getDisputeDetail(@Param('id') disputeId: string) {
    const detail = await this.disputeService.getDisputeDetail(disputeId);

    // Generate signed view URL for the judge
    let viewUrl: string | null = null;
    if (detail.mediaUri) {
      try {
        viewUrl = await this.r2.generateViewUrl(detail.mediaUri);
      } catch {
        // R2 unavailable — degrade gracefully
      }
    }

    return { ...detail, viewUrl };
  }

  @Post('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute with a judge verdict (UPHELD, OVERTURNED, ESCALATED)' })
  async resolveDispute(
    @Param('id') disputeId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { outcome: 'UPHELD' | 'OVERTURNED' | 'ESCALATED'; judgeNotes: string },
  ) {
    return this.disputeService.resolveDispute(disputeId, user.id, body.outcome, body.judgeNotes);
  }

  // --- User Inspection ---

  @Get('users/:id')
  @ApiOperation({ summary: 'Get full user profile with contract, proof, and assignment history' })
  async getUserProfile(@Param('id') userId: string) {
    const [user, contracts, proofs, assignments] = await Promise.all([
      this.pool.query(
        `SELECT id, email, role, status, integrity_score, created_at FROM users WHERE id = $1`,
        [userId],
      ),
      this.pool.query(
        `SELECT id, oath_category, status, stake_amount, started_at, ends_at
         FROM contracts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
        [userId],
      ),
      this.pool.query(
        `SELECT id, contract_id, status, submitted_at
         FROM proofs WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 20`,
        [userId],
      ),
      this.pool.query(
        `SELECT fa.id, fa.verdict, fa.reviewed_at, p.contract_id
         FROM fury_assignments fa
         JOIN proofs p ON fa.proof_id = p.id
         WHERE fa.fury_user_id = $1
         ORDER BY fa.assigned_at DESC LIMIT 50`,
        [userId],
      ),
    ]);

    if (user.rows.length === 0) return { error: 'User not found' };

    return {
      user: user.rows[0],
      contracts: contracts.rows,
      proofs: proofs.rows,
      furyAssignments: assignments.rows,
    };
  }

  @Patch('users/:id/integrity')
  @ApiOperation({ summary: 'Manually adjust a user integrity score (admin override)' })
  async adjustIntegrity(
    @Param('id') userId: string,
    @CurrentUser() admin: { id: string },
    @Body() body: { delta: number; reason: string },
  ) {
    await this.pool.query(
      `UPDATE users
       SET integrity_score = GREATEST(0, LEAST(100, integrity_score + $1))
       WHERE id = $2`,
      [body.delta, userId],
    );

    return { status: 'integrity_adjusted', userId, delta: body.delta, reason: body.reason };
  }

  @Post('users/:id/compliance/identity/mock-complete')
  @ApiOperation({ summary: 'Admin override: complete identity verification in mock/provider-test mode' })
  async completeIdentityVerificationForUser(
    @Param('id') userId: string,
    @Body() body: { mode?: IdentityVerificationMode; status?: 'VERIFIED' | 'FAILED' | 'REJECTED' },
  ) {
    return this.identityVerification.completeMockVerification({
      userId,
      mode: body.mode || 'KYC_AND_AGE',
      status: body.status || 'VERIFIED',
    });
  }

  @Get('reconciliation')
  @ApiOperation({ summary: 'Get reconciliation visibility for contract/payment inconsistencies and dispute fee side effects' })
  async getReconciliationVisibility(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit || 25);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(100, parsedLimit)) : 25;

    const [contracts, disputeFeeSideEffects, summary] = await Promise.all([
      this.pool.query(
        `SELECT id, user_id, status, payment_intent_id, stake_amount, updated_at
         FROM contracts
         WHERE status = 'RECONCILE_REQUIRED'
         ORDER BY updated_at DESC
         LIMIT $1`,
        [safeLimit],
      ),
      this.pool.query(
        `SELECT id, contract_id, outcome, effect_type, status, attempts, last_error,
                next_retry_at, quarantined_at, quarantine_reason, created_at
         FROM contract_resolution_side_effects
         WHERE (
           outcome LIKE 'DISPUTE_%'
           OR effect_type IN ('STRIPE_CAPTURE_APPEAL_FEE', 'STRIPE_CANCEL_APPEAL_FEE')
         )
           AND status IN ('PENDING', 'FAILED', 'QUARANTINED')
         ORDER BY created_at DESC
         LIMIT $1`,
        [safeLimit],
      ),
      this.pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM contracts WHERE status = 'RECONCILE_REQUIRED') AS contract_reconcile_required_count,
           (SELECT COUNT(*)::int FROM contract_resolution_side_effects
             WHERE (outcome LIKE 'DISPUTE_%' OR effect_type IN ('STRIPE_CAPTURE_APPEAL_FEE', 'STRIPE_CANCEL_APPEAL_FEE'))
               AND status IN ('PENDING', 'FAILED', 'QUARANTINED')) AS dispute_fee_side_effect_backlog_count`,
      ),
    ]);

    return {
      summary: summary.rows[0],
      contracts: contracts.rows,
      disputeFeeSideEffects: disputeFeeSideEffects.rows,
    };
  }

  // --- Anomaly Detection ---

  @Post('anomaly/scan')
  @ApiOperation({ summary: 'Scan all stored proof hashes for pHash collisions' })
  async scanHashCollisions() {
    const proofs = await this.pool.query(
      `SELECT p.id, p.user_id, p.contract_id, p.media_uri, p.submitted_at
       FROM proofs p
       WHERE p.media_uri IS NOT NULL
       ORDER BY p.submitted_at DESC
       LIMIT 1000`,
    );

    const collisions: Array<{
      origin: { id: string; pHash: string; user: string; contractId: string; timestamp: string; similarity: number };
      duplicate: { id: string; pHash: string; user: string; contractId: string; timestamp: string; similarity: number };
    }> = [];

    const hashed = proofs.rows.map((row: any) => ({
      ...row,
      pHash: this.anomaly.computePHash(row.media_uri),
    }));

    for (let i = 0; i < hashed.length; i++) {
      for (let j = i + 1; j < hashed.length; j++) {
        const distance = this.anomaly.hammingDistance(hashed[i].pHash, hashed[j].pHash);
        if (distance < 5) {
          const similarity = Math.round((1 - distance / 64) * 1000) / 10;
          collisions.push({
            origin: {
              id: hashed[i].id,
              pHash: hashed[i].pHash,
              user: hashed[i].user_id,
              contractId: hashed[i].contract_id,
              timestamp: hashed[i].submitted_at,
              similarity: 100,
            },
            duplicate: {
              id: hashed[j].id,
              pHash: hashed[j].pHash,
              user: hashed[j].user_id,
              contractId: hashed[j].contract_id,
              timestamp: hashed[j].submitted_at,
              similarity,
            },
          });
        }
      }
    }

    return { collisions };
  }

  // --- Platform Stats ---

  @Get('stats')
  @ApiOperation({ summary: 'Get platform-wide statistics' })
  async getStats() {
    const [users, contracts, proofs, integrity, disputes] = await Promise.all([
      this.pool.query(`SELECT COUNT(*) as count FROM users WHERE status = 'ACTIVE'`),
      this.pool.query(`SELECT COUNT(*) as count FROM contracts WHERE status = 'ACTIVE'`),
      this.pool.query(`SELECT COUNT(*) as count FROM proofs WHERE status IN ('PENDING_REVIEW', 'IN_REVIEW', 'DISPUTED')`),
      this.pool.query(`SELECT COALESCE(AVG(integrity_score), 0) as avg FROM users WHERE status = 'ACTIVE'`),
      this.pool.query(`SELECT COUNT(*) as count FROM disputes WHERE appeal_status IN ('FEE_AUTHORIZED_PENDING_REVIEW', 'IN_REVIEW')`),
    ]);
    return {
      totalUsers: Number(users.rows[0].count),
      activeContracts: Number(contracts.rows[0].count),
      pendingProofs: Number(proofs.rows[0].count),
      avgIntegrity: Math.round(Number(integrity.rows[0].avg) * 100) / 100,
      pendingDisputes: Number(disputes.rows[0].count),
    };
  }
}
