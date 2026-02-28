import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards, ForbiddenException, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser, Public } from '../../common/decorators/current-user.decorator';
import { IdentityVerificationService } from '../compliance/identity-verification.service';
import { IdentityVerificationMode } from '../compliance/identity-provider.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly identityVerification: IdentityVerificationService,
  ) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: { id: string }) {
    return this.usersService.getProfile(user.id);
  }

  @Get('me/compliance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get compliance and identity verification status for the authenticated user' })
  @UseGuards(AuthGuard)
  async getComplianceStatus(@CurrentUser() user: { id: string }) {
    return this.identityVerification.getUserComplianceStatus(user.id);
  }

  @Post('me/compliance/identity/start')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start identity verification (mock or provider-backed) for the authenticated user' })
  @UseGuards(AuthGuard)
  async startIdentityVerification(
    @CurrentUser() user: { id: string },
    @Body() body: {
      mode?: IdentityVerificationMode;
      returnUrl?: string;
      refreshUrl?: string;
    },
  ) {
    return this.identityVerification.startVerificationFlow({
      userId: user.id,
      mode: body.mode || 'KYC_AND_AGE',
      returnUrl: body.returnUrl,
      refreshUrl: body.refreshUrl,
    });
  }

  @Post('me/compliance/identity/mock-complete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete identity verification in mock mode for local/dev testing' })
  @UseGuards(AuthGuard)
  async completeIdentityVerificationMock(
    @CurrentUser() user: { id: string },
    @Body() body: { mode?: IdentityVerificationMode; status?: 'VERIFIED' | 'FAILED' | 'REJECTED' },
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Mock identity completion endpoint is disabled in production');
    }

    return this.identityVerification.completeMockVerification({
      userId: user.id,
      mode: body.mode || 'KYC_AND_AGE',
      status: body.status || 'VERIFIED',
    });
  }

  @Get('me/history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get contract history for the authenticated user' })
  @UseGuards(AuthGuard)
  async getHistory(@CurrentUser() user: { id: string }) {
    return this.usersService.getUserHistory(user.id);
  }

  @Patch('me/password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the authenticated user password' })
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() body: { currentPassword: string; newPassword: string }, // allow-secret
  ) {
    return this.usersService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  @Patch('me/settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification preferences' })
  @UseGuards(AuthGuard)
  async updateSettings(
    @CurrentUser() user: { id: string },
    @Body() body: { emailNotifications?: boolean; pushNotifications?: boolean },
  ) {
    return this.usersService.updateSettings(user.id, body);
  }

  @Delete('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request account deletion (GDPR)' })
  @UseGuards(AuthGuard)
  async deleteAccount(@CurrentUser() user: { id: string }) {
    return this.usersService.requestDeletion(user.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get the public integrity leaderboard' })
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getLeaderboard(@Query('limit') limit?: string, @Query('period') period?: string) {
    return this.usersService.getLeaderboard(limit ? parseInt(limit, 10) : 10, period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a public user profile by ID' })
  @Public()
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
