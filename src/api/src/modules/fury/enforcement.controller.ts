import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../../guards/auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EnforcementService } from './enforcement.service';

@ApiTags('Fury')
@ApiBearerAuth()
@Controller('fury/enforcement')
@UseGuards(AuthGuard, RoleGuard)
export class EnforcementController {
  constructor(private readonly enforcementService: EnforcementService) {}

  @Post('evaluate')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Evaluate collusion incidents from review events (Admin only)' })
  async evaluate(@Body() dto: { proofId: string; flaggedFuries: string[] }) {
    await this.enforcementService.evaluateCollusion(dto.proofId, dto.flaggedFuries);
    return { success: true };
  }

  @Post('confirm/:caseId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Confirm a pending enforcement case and apply penalty (Admin only)' })
  async confirm(
    @Param('caseId') caseId: string,
    @Body() dto: { penaltyType?: string; amountCents?: number },
  ) {
    return this.enforcementService.confirmCase(
      caseId,
      dto.penaltyType || 'REP_BURN',
      dto.amountCents || 0,
    );
  }

  @Post('appeals/:caseId')
  @ApiOperation({ summary: 'Appeal an enforcement penalty' })
  async appeal(
    @Param('caseId') caseId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: { reason: string }
  ) {
    return this.enforcementService.appealCase(caseId, user.id, dto.reason);
  }

  @Post('appeals/:caseId/resolve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Resolve an appeal — approve (uphold penalty) or reverse (overturn)' })
  async resolveAppeal(
    @Param('caseId') caseId: string,
    @Body() dto: { outcome: 'UPHELD' | 'REVERSED'; reason?: string },
  ) {
    return this.enforcementService.resolveAppeal(caseId, dto.outcome, dto.reason);
  }
}
