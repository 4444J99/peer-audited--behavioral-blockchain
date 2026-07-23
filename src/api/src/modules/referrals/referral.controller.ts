import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReferralService } from './referral.service';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('code')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get your referral code and share URL' })
  @UseGuards(AuthGuard)
  async getCode(@CurrentUser() user: { id: string }) {
    return this.referralService.getCode(user.id);
  }

  @Get('rewards')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral stats and reward history' })
  @UseGuards(AuthGuard)
  async getRewards(@CurrentUser() user: { id: string }) {
    return this.referralService.getStats(user.id);
  }
}
