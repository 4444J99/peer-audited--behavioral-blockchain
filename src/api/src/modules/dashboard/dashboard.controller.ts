import { Controller, Get, Post, Query, Res, UseGuards, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { Observable, timer } from 'rxjs';
import { map, concatMap } from 'rxjs/operators';
import { AuthGuard } from '../../../guards/auth.guard';
import { issueSseTicket } from '../../../guards/sse-ticket.store';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { UsersService } from '../users/users.service';

const LEADERBOARD_STREAM_INTERVAL_MS = 30_000;
const LEADERBOARD_STREAM_COOKIE = 'styx_leaderboard_sse_ticket';
// Must match the suffix AuthGuard matches this stream on, so the browser only
// ever attaches the ticket cookie to the stream request itself.
const LEADERBOARD_STREAM_PATH = '/dashboard/leaderboard/stream';
const LEADERBOARD_DEFAULT_LIMIT = 10;

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly usersService: UsersService,
  ) {}

  @Get('progress')
  @ApiOperation({ summary: 'Get aggregated goal-gradient progress telemetry' })
  async getProgress(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getProgress(user.id);
  }

  @Get('streak')
  @ApiOperation({ summary: 'Get 30-day streak chain with Never Miss Twice status' })
  async getStreak(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getStreakChain(user.id);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get platform-wide ledger & payments metrics' })
  async getMetrics() {
    return this.dashboardService.getMetrics();
  }

  @Sse('leaderboard/stream')
  @ApiOperation({ summary: 'Stream live leaderboard rank updates via SSE' })
  streamLeaderboard(
    @Query('limit') limit?: string,
    @Query('period') period?: string,
  ): Observable<MessageEvent> {
    // The stream mirrors GET /users/leaderboard, so a subscriber that switches
    // period gets the same rows it would have polled for — without the switch
    // silently downgrading it to the hardcoded all-time board.
    const parsedLimit = Number.parseInt(limit ?? '', 10);
    const size = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? parsedLimit
      : LEADERBOARD_DEFAULT_LIMIT;

    return timer(0, LEADERBOARD_STREAM_INTERVAL_MS).pipe(
      concatMap(() => this.usersService.getLeaderboard(size, period)),
      map((data) => ({ data } as MessageEvent)),
    );
  }

  // Cookie only, no query-string twin: EventSource cannot set an Authorization
  // header, and a ticket in the URL leaks into proxy logs and Referer headers
  // (AU8). Nothing in this repo consumes a leaderboard ticket any other way.
  @Post('leaderboard/stream-cookie')
  @ApiOperation({ summary: 'Issue a short-lived HttpOnly cookie for leaderboard SSE subscription' })
  issueLeaderboardStreamCookie(
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const issued = issueSseTicket(user.id, 'leaderboard');
    res.cookie(LEADERBOARD_STREAM_COOKIE, issued.ticket, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: LEADERBOARD_STREAM_PATH,
      maxAge: issued.expiresInSeconds * 1000,
    });
    return { expiresInSeconds: issued.expiresInSeconds };
  }
}
