import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReferralService } from './referral.service';

export interface NominatePeerDto {
  nomineeEmail: string;
  nomineeName?: string;
  note?: string;
}

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

  @Get('cohort-invites')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get curated cohort invite quota and active peer nominations' })
  @UseGuards(AuthGuard)
  async getCohortInvites(@CurrentUser() user: { id: string }) {
    return this.referralService.getCohortInviteQuota(user.id);
  }

  @Post('nominate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Nominate an aligned peer for beta cohort admission (limit 2)' })
  @UseGuards(AuthGuard)
  async nominate(
    @CurrentUser() user: { id: string },
    @Body() body: NominatePeerDto,
  ) {
    return this.referralService.nominateCohortPeer(
      user.id,
      body.nomineeEmail,
      body.nomineeName,
      body.note,
    );
  }
}
