import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SocialLayerService } from './social-layer.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Social')
@Controller('social')
export class SocialController {
  constructor(private readonly socialLayer: SocialLayerService) {}

  @Get('profile/me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my own pseudonymous public profile' })
  async getMyProfile(@CurrentUser() user: { id: string }) {
    return this.socialLayer.getPublicProfile(user.id);
  }

  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get a pseudonymous public profile by user ID' })
  async getProfile(@Param('userId') userId: string) {
    return this.socialLayer.getPublicProfile(userId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get the Tavern Board (Top Integrity Leaders)' })
  async getLeaderboard() {
    return this.socialLayer.getLeaderboard();
  }
}
