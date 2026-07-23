import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PodOrchestrationService } from './pod-orchestration.service';

describe('PodOrchestrationService', () => {
  let service: PodOrchestrationService;
  let pool: any;

  const mockPool = () => ({ query: jest.fn() });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PodOrchestrationService,
        { provide: 'DATABASE_POOL', useFactory: mockPool },
      ],
    }).compile();

    service = module.get<PodOrchestrationService>(PodOrchestrationService);
    pool = module.get('DATABASE_POOL');
  });

  describe('enforceMaxPodSize', () => {
    it('returns allowed true when under limit', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: 2 }], rowCount: 1 } as any);

      const result = await service.enforceMaxPodSize('pod-1', 'cohort-1');

      expect(result).toEqual({ allowed: true, currentCount: 2, maxMembers: 5 });
    });

    it('returns allowed false when at limit', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: 5 }], rowCount: 1 } as any);

      const result = await service.enforceMaxPodSize('pod-1', 'cohort-1');

      expect(result).toEqual({ allowed: false, currentCount: 5, maxMembers: 5 });
    });

    it('returns allowed true when pod is empty', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 } as any);

      const result = await service.enforceMaxPodSize('pod-1', 'cohort-1');

      expect(result).toEqual({ allowed: true, currentCount: 0, maxMembers: 5 });
    });
  });

  describe('addMemberToPod', () => {
    it('succeeds when under limit', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: 3 }], rowCount: 1 } as any);
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const result = await service.addMemberToPod('user-1', 'pod-1', 'cohort-1', 'contract-1', 'Alex');

      expect(result).toEqual(expect.objectContaining({
        userId: 'user-1',
        alias: 'Alex',
        contractId: 'contract-1',
        status: 'ACTIVE',
      }));
      expect(result.joinedAt).toBeInstanceOf(Date);
    });

    it('uses default alias when none provided', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 } as any);
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const result = await service.addMemberToPod('user-2', 'pod-1', 'cohort-1', 'contract-2');

      expect(result.alias).toBe('Participant');
    });

    it('throws BadRequestException when pod is full', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: 5 }], rowCount: 1 } as any);

      await expect(
        service.addMemberToPod('user-6', 'pod-1', 'cohort-1', 'contract-6'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when pod has 4 members and tries to add 6th', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: 5 }], rowCount: 1 } as any);

      await expect(
        service.addMemberToPod('user-6', 'pod-1', 'cohort-1', 'contract-6'),
      ).rejects.toThrow('Pod pod-1 is full (max 5)');
    });
  });

  describe('removeMemberFromPod', () => {
    it('succeeds when member exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await expect(
        service.removeMemberFromPod('user-1', 'pod-1', 'cohort-1'),
      ).resolves.toBeUndefined();
    });

    it('throws NotFoundException when member not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(
        service.removeMemberFromPod('user-99', 'pod-1', 'cohort-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPeerIdentities', () => {
    it('returns ANONYMOUS for members under 7 days', async () => {
      const recentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      pool.query.mockResolvedValueOnce({
        rows: [
          { user_id: 'user-1', display_alias: 'Alice Smith', created_at: recentDate },
          { user_id: 'user-2', display_alias: 'Bob Jones', created_at: recentDate },
        ],
        rowCount: 2,
      } as any);

      const result = await service.getPeerIdentities('pod-1', 'cohort-1', 'user-1');

      expect(result[0]).toEqual({
        userId: 'user-1',
        revealLevel: 'FULL_ALIAS',
        alias: 'Alice Smith',
      });
      expect(result[1]).toEqual({
        userId: 'user-2',
        revealLevel: 'ANONYMOUS',
        alias: 'Member 2',
      });
    });

    it('returns FIRST_NAME for members between 7-29 days', async () => {
      const midDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
      pool.query.mockResolvedValueOnce({
        rows: [
          { user_id: 'user-1', display_alias: 'Alice Smith', created_at: midDate },
          { user_id: 'user-2', display_alias: 'Bob Jones', created_at: midDate },
        ],
        rowCount: 2,
      } as any);

      const result = await service.getPeerIdentities('pod-1', 'cohort-1', 'user-1');

      expect(result[1]).toEqual({
        userId: 'user-2',
        revealLevel: 'FIRST_NAME',
        alias: 'Bob',
      });
    });

    it('returns FULL_ALIAS for members with 30+ days', async () => {
      const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
      pool.query.mockResolvedValueOnce({
        rows: [
          { user_id: 'user-1', display_alias: 'Alice Smith', created_at: oldDate },
          { user_id: 'user-2', display_alias: 'Bob Jones', created_at: oldDate },
        ],
        rowCount: 2,
      } as any);

      const result = await service.getPeerIdentities('pod-1', 'cohort-1', 'user-1');

      expect(result[1]).toEqual({
        userId: 'user-2',
        revealLevel: 'FULL_ALIAS',
        alias: 'Bob Jones',
      });
    });

    it('always shows requesting user their own FULL_ALIAS', async () => {
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      pool.query.mockResolvedValueOnce({
        rows: [
          { user_id: 'user-1', display_alias: 'Alice Smith', created_at: recentDate },
        ],
        rowCount: 1,
      } as any);

      const result = await service.getPeerIdentities('pod-1', 'cohort-1', 'user-1');

      expect(result[0]).toEqual({
        userId: 'user-1',
        revealLevel: 'FULL_ALIAS',
        alias: 'Alice Smith',
      });
    });

    it('falls back to Participant when alias is missing', async () => {
      const recentDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
      pool.query.mockResolvedValueOnce({
        rows: [
          { user_id: 'user-1', display_alias: null, created_at: recentDate },
        ],
        rowCount: 1,
      } as any);

      const result = await service.getPeerIdentities('pod-1', 'cohort-1', 'user-2');

      expect(result[0]).toEqual({
        userId: 'user-1',
        revealLevel: 'FIRST_NAME',
        alias: 'Participant',
      });
    });
  });

  describe('broadcastPodFailure', () => {
    it('broadcasts and logs when not dampened', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ failure_count: 0, last_broadcast_at: null }],
        rowCount: 1,
      } as any);
      pool.query.mockResolvedValueOnce({
        rows: [{ member_count: 4 }],
        rowCount: 1,
      } as any);
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const result = await service.broadcastPodFailure('pod-1', 'cohort-1', {
        userId: 'user-1',
        type: 'MISSED_CHECK_IN',
      });

      expect(result.broadcast).toBe(true);
      expect(result.dampened).toBe(false);
      expect(result.recipientsNotified).toBe(3);
    });

    it('dampens when broadcast is within cooldown', async () => {
      const recentBroadcast = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      pool.query.mockResolvedValueOnce({
        rows: [{ failure_count: 5, last_broadcast_at: recentBroadcast }],
        rowCount: 1,
      } as any);
      pool.query.mockResolvedValueOnce({
        rows: [{ member_count: 3 }],
        rowCount: 1,
      } as any);

      const result = await service.broadcastPodFailure('pod-1', 'cohort-1', {
        userId: 'user-2',
        type: 'RELAPSE',
      });

      expect(result.dampened).toBe(true);
      expect(result.recipientsNotified).toBe(0);
    });

    it('does not log to pod_broadcast_log when dampened', async () => {
      const recentBroadcast = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      pool.query.mockResolvedValueOnce({
        rows: [{ failure_count: 3, last_broadcast_at: recentBroadcast }],
        rowCount: 1,
      } as any);
      pool.query.mockResolvedValueOnce({
        rows: [{ member_count: 4 }],
        rowCount: 1,
      } as any);

      await service.broadcastPodFailure('pod-1', 'cohort-1', {
        userId: 'user-1',
        type: 'MISSED_CHECK_IN',
      });

      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPodStats', () => {
    it('returns correct aggregations', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { user_id: 'user-1', status: 'ACTIVE' },
          { user_id: 'user-2', status: 'ACTIVE' },
          { user_id: 'user-3', status: 'LEFT' },
        ],
        rowCount: 3,
      } as any);
      pool.query.mockResolvedValueOnce({
        rows: [{ avg_streak: 12.5 }],
        rowCount: 1,
      } as any);
      pool.query.mockResolvedValueOnce({
        rows: [{ total: 7 }],
        rowCount: 1,
      } as any);

      const result = await service.getPodStats('pod-1', 'cohort-1');

      expect(result).toEqual({
        totalMembers: 3,
        activeMembers: 2,
        avgStreakDays: 12.5,
        totalFailures: 7,
      });
    });

    it('handles empty pod', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      pool.query.mockResolvedValueOnce({ rows: [{ total: 0 }], rowCount: 1 } as any);

      const result = await service.getPodStats('pod-empty', 'cohort-1');

      expect(result).toEqual({
        totalMembers: 0,
        activeMembers: 0,
        avgStreakDays: 0,
        totalFailures: 0,
      });
    });
  });

  describe('getPodState', () => {
    it('returns full pod state with broadcast count', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            contract_id: 'c-1',
            user_id: 'user-1',
            status: 'ACTIVE',
            created_at: new Date('2026-01-01').toISOString(),
            display_alias: 'Alice',
          },
          {
            contract_id: 'c-2',
            user_id: 'user-2',
            status: 'ACTIVE',
            created_at: new Date('2026-01-02').toISOString(),
            display_alias: 'Bob',
          },
        ],
        rowCount: 2,
      } as any);
      pool.query.mockResolvedValueOnce({
        rows: [{ total: 3 }],
        rowCount: 1,
      } as any);

      const result = await service.getPodState('pod-1', 'cohort-1');

      expect(result.podId).toBe('pod-1');
      expect(result.cohortId).toBe('cohort-1');
      expect(result.members).toHaveLength(2);
      expect(result.activeCount).toBe(2);
      expect(result.maxMembers).toBe(5);
      expect(result.failureBroadcasts).toBe(3);
    });
  });

  describe('getPodMembers', () => {
    it('returns member list with correct status mapping', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            contract_id: 'c-1',
            user_id: 'user-1',
            status: 'ACTIVE',
            created_at: new Date('2026-01-01').toISOString(),
            display_alias: 'Alice',
          },
          {
            contract_id: 'c-2',
            user_id: 'user-2',
            status: 'PENDING_STAKE',
            created_at: new Date('2026-01-02').toISOString(),
            display_alias: 'Bob',
          },
          {
            contract_id: 'c-3',
            user_id: 'user-3',
            status: 'COMPLETED',
            created_at: new Date('2026-01-03').toISOString(),
            display_alias: 'Charlie',
          },
        ],
        rowCount: 3,
      } as any);

      const result = await service.getPodMembers('pod-1', 'cohort-1');

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe('ACTIVE');
      expect(result[1].status).toBe('ACTIVE');
      expect(result[2].status).toBe('LEFT');
    });
  });
});
