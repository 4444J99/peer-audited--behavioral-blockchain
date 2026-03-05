import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EnforcementService } from './enforcement.service';

@ApiTags('Fury')
@ApiBearerAuth()
@Controller('fury/enforcement')
@UseGuards(AuthGuard)
export class EnforcementController {
  constructor(private readonly enforcementService: EnforcementService) {}

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate collusion incidents from review events (Admin only in reality)' })
  async evaluate(@Body() dto: { proofId: string; flaggedFuries: string[] }) {
    // In a real implementation, this might be a cron job or admin endpoint
    await this.enforcementService.evaluateCollusion(dto.proofId, dto.flaggedFuries);
    return { success: true };
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
}

