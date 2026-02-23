import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser, Public } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: { id: string }) {
    return this.usersService.getProfile(user.id);
  }

  @Get('me/history')
  @UseGuards(AuthGuard)
  async getHistory(@CurrentUser() user: { id: string }) {
    return this.usersService.getUserHistory(user.id);
  }

  @Get('leaderboard')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getLeaderboard(@Query('limit') limit?: string) {
    return this.usersService.getLeaderboard(limit ? parseInt(limit, 10) : 10);
  }

  @Get(':id')
  @Public()
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
