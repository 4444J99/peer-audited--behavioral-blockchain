import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../guards/auth.guard';
import { ModerationService } from '../../../services/security/moderation.service';
import { HoneypotInjectorService } from '../../../services/intelligence/honeypot.service';

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(
    private readonly moderation: ModerationService,
    private readonly honeypot: HoneypotInjectorService,
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
}
