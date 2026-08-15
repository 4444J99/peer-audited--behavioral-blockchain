import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UsersService } from '../users/users.service';

jest.mock('../../../guards/sse-ticket.store', () => ({
  issueSseTicket: jest.fn().mockReturnValue({
    ticket: 'leaderboard-ticket-abc',
    expiresInSeconds: 60,
  }),
}));

import { issueSseTicket } from '../../../guards/sse-ticket.store';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: jest.Mocked<
    Pick<DashboardService, 'getProgress' | 'getStreakChain' | 'getMetrics'>
  >;
  let usersService: jest.Mocked<Pick<UsersService, 'getLeaderboard'>>;

  const user = { id: 'user-001' };

  beforeEach(() => {
    dashboardService = {
      getProgress: jest.fn(),
      getStreakChain: jest.fn(),
      getMetrics: jest.fn(),
    };
    usersService = {
      getLeaderboard: jest.fn(),
    };
    controller = new DashboardController(
      dashboardService as unknown as DashboardService,
      usersService as unknown as UsersService,
    );
    jest.clearAllMocks();
    // Re-arm after clearAllMocks — jest.mock is hoisted above the assignment.
    (issueSseTicket as jest.Mock).mockReturnValue({
      ticket: 'leaderboard-ticket-abc',
      expiresInSeconds: 60,
    });
  });

  describe('getProgress', () => {
    it('returns goal-gradient telemetry for the current user', async () => {
      const progress = {
        activeContracts: [
          {
            id: 'c-1',
            oath_category: 'NO_CONTACT',
            status: 'ACTIVE',
            stake_amount: '25.00',
            duration_days: 30,
            started_at: '2026-08-01T00:00:00Z',
            ends_at: '2026-08-31T00:00:00Z',
            streak: '7',
          },
        ],
        protectedVaultBalanceCents: 1500,
        summary: { totalActiveStakeUsd: 25, longestStreak: 7 },
      };
      dashboardService.getProgress.mockResolvedValue(progress);

      const result = await controller.getProgress(user);

      expect(result).toEqual(progress);
      expect(dashboardService.getProgress).toHaveBeenCalledWith('user-001');
    });
  });

  describe('streamLeaderboard', () => {
    it('emits the leaderboard rows on the first tick', async () => {
      const rows = [
        {
          id: 'u-1',
          email: 'a@styx.protocol',
          integrity_score: 91,
          created_at: '2026-01-01T00:00:00Z',
        },
      ];
      usersService.getLeaderboard.mockResolvedValue(rows);

      const event = await firstValueFrom(
        controller.streamLeaderboard().pipe(take(1)),
      );

      expect(event).toEqual({ data: rows });
    });

    it('honors the period so a subscriber is not pinned to the all-time board', async () => {
      usersService.getLeaderboard.mockResolvedValue([]);

      await firstValueFrom(
        controller.streamLeaderboard('5', 'weekly').pipe(take(1)),
      );

      expect(usersService.getLeaderboard).toHaveBeenCalledWith(5, 'weekly');
    });

    it('falls back to the default size for a missing or unusable limit', async () => {
      usersService.getLeaderboard.mockResolvedValue([]);

      await firstValueFrom(controller.streamLeaderboard().pipe(take(1)));
      expect(usersService.getLeaderboard).toHaveBeenLastCalledWith(10, undefined);

      await firstValueFrom(
        controller.streamLeaderboard('not-a-number').pipe(take(1)),
      );
      expect(usersService.getLeaderboard).toHaveBeenLastCalledWith(10, undefined);

      await firstValueFrom(controller.streamLeaderboard('0').pipe(take(1)));
      expect(usersService.getLeaderboard).toHaveBeenLastCalledWith(10, undefined);
    });
  });

  describe('issueLeaderboardStreamCookie', () => {
    it('sets an HttpOnly cookie scoped to the stream path', () => {
      const mockRes = { cookie: jest.fn() } as any;

      const result = controller.issueLeaderboardStreamCookie(user, mockRes);

      expect(result).toEqual({ expiresInSeconds: 60 });
      expect(issueSseTicket).toHaveBeenCalledWith('user-001', 'leaderboard');
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'styx_leaderboard_sse_ticket',
        'leaderboard-ticket-abc',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/dashboard/leaderboard/stream',
          maxAge: 60000,
        }),
      );
    });
  });
});
