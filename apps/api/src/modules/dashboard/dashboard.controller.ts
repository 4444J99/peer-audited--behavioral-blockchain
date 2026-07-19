import { Controller, Get, UseGuards, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, timer } from 'rxjs';
import { map, concatMap } from 'rxjs/operators';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { UsersService } from '../users/users.service';

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

  @Sse('leaderboard/stream')
  @ApiOperation({ summary: 'Stream live leaderboard rank updates via SSE' })
  streamLeaderboard(@CurrentUser() user: { id: string }): Observable<MessageEvent> {
    return timer(0, 30000).pipe(
      concatMap(() => this.usersService.getLeaderboard(10, 'all-time')),
      map((data) => ({ data } as MessageEvent)),
    );
  }
}

