import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ModerationService } from '../../../services/security/moderation.service';
import { HoneypotInjectorService } from '../../../services/intelligence/honeypot.service';
import { ContractsService } from '../contracts/contracts.service';

@Controller('admin')
@UseGuards(AuthGuard, RoleGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly moderation: ModerationService,
    private readonly honeypot: HoneypotInjectorService,
    private readonly contractsService: ContractsService,
    private readonly pool: Pool,
  ) {}

  @Post('honeypot')
  async injectHoneypot() {
    const jobId = await this.honeypot.injectKnownFail();
    return { status: 'honeypot_injected', jobId };
  }

  @Post('ban/:userId')
  async banUser(
    @Param('userId') targetUserId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { reason: string },
  ) {
    return this.moderation.banUser(user.id, targetUserId, body.reason);
  }

  @Post('resolve/:contractId')
  async resolveContract(
    @Param('contractId') contractId: string,
    @Body() body: { outcome: 'COMPLETED' | 'FAILED' },
  ) {
    await this.contractsService.resolveContract(contractId, body.outcome);
    return { status: 'resolved', contractId, outcome: body.outcome };
  }

  @Get('stats')
  async getStats() {
    const [users, contracts, proofs, integrity] = await Promise.all([
      this.pool.query(`SELECT COUNT(*) as count FROM users WHERE status = 'ACTIVE'`),
      this.pool.query(`SELECT COUNT(*) as count FROM contracts WHERE status = 'ACTIVE'`),
      this.pool.query(`SELECT COUNT(*) as count FROM proofs WHERE status IN ('PENDING_REVIEW', 'IN_REVIEW')`),
      this.pool.query(`SELECT COALESCE(AVG(integrity_score), 0) as avg FROM users WHERE status = 'ACTIVE'`),
    ]);
    return {
      totalUsers: Number(users.rows[0].count),
      activeContracts: Number(contracts.rows[0].count),
      pendingProofs: Number(proofs.rows[0].count),
      avgIntegrity: Math.round(Number(integrity.rows[0].avg) * 100) / 100,
    };
  }
}
