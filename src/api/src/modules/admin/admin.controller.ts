import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../guards/auth.guard';
import { ModerationService } from '../../../services/security/moderation.service';
import { HoneypotInjectorService } from '../../../services/intelligence/honeypot.service';
import { ContractsService } from '../contracts/contracts.service';

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(
    private readonly moderation: ModerationService,
    private readonly honeypot: HoneypotInjectorService,
    private readonly contractsService: ContractsService,
  ) {}

  @Post('honeypot')
  async injectHoneypot() {
    const jobId = await this.honeypot.injectKnownFail();
    return { status: 'honeypot_injected', jobId };
  }

  @Post('ban/:userId')
  async banUser(
    @Param('userId') targetUserId: string,
    @Body() body: { adminId: string; reason: string },
  ) {
    return this.moderation.banUser(body.adminId, targetUserId, body.reason);
  }

  @Post('resolve/:contractId')
  async resolveContract(
    @Param('contractId') contractId: string,
    @Body() body: { outcome: 'COMPLETED' | 'FAILED'; adminId: string },
  ) {
    await this.contractsService.resolveContract(contractId, body.outcome);
    return { status: 'resolved', contractId, outcome: body.outcome };
  }
}
