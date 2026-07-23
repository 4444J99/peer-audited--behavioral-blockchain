import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  ProgressDashboardService,
  StreakInfo,
  Milestone,
  RelapseRiskScore,
} from './progress-dashboard.service';

describe('ProgressDashboardService', () => {
  let service: ProgressDashboardService;
  let pool: any;

  const mockPool = () => ({
    query: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressDashboardService,
        { provide: 'DATABASE_POOL', useFactory: mockPool },
      ],
    }).compile();

    service = module.get<ProgressDashboardService>(ProgressDashboardService);
    pool = module.get('DATABASE_POOL');
  });

  describe('getStreakInfo', () => {
    it('returns zeros for no proofs', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await service.getStreakInfo('user-1');
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.totalDays).toBe(0);
      expect(result.streakStartDate).toBeNull();
    });

    it('calculates current streak correctly', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);

      pool.query.mockResolvedValueOnce({
        rows: [
          { proof_date: today.toISOString().split('T')[0] },
          { proof_date: yesterday.toISOString().split('T')[0] },
          { proof_date: twoDaysAgo.toISOString().split('T')[0] },
        ],
        rowCount: 3,
      } as any);

      const result = await service.getStreakInfo('user-1');
      expect(result.currentStreak).toBe(3);
      expect(result.totalDays).toBe(3);
    });

    it('calculates longest streak across gaps', async () => {
      const today = new Date();
      const dates: string[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }
      for (let i = 10; i < 13; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }

      pool.query.mockResolvedValueOnce({
        rows: dates.map((d) => ({ proof_date: d })),
        rowCount: dates.length,
      } as any);

      const result = await service.getStreakInfo('user-1');
      expect(result.longestStreak).toBe(5);
    });
  });

  describe('getMilestones', () => {
    it('throws for missing contract', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(
        service.getMilestones('user-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns milestones with correct achieved status', async () => {
      const startedAt = new Date();
      startedAt.setUTCDate(startedAt.getUTCDate() - 5);

      pool.query
        .mockResolvedValueOnce({
          rows: [{ started_at: startedAt.toISOString() }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ cnt: '5' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ first_at: startedAt.toISOString() }],
          rowCount: 1,
        } as any);

      const milestones = await service.getMilestones('user-1', 'contract-1');
      expect(milestones).toHaveLength(7);

      const firstProof = milestones.find((m) => m.type === 'FIRST_PROOF');
      expect(firstProof?.achievedAt).not.toBeNull();

      const week1 = milestones.find((m) => m.type === 'WEEK_1');
      expect(week1?.achievedAt).toBeNull();

      const week2 = milestones.find((m) => m.type === 'WEEK_2');
      expect(week2?.achievedAt).toBeNull();
    });

    it('marks week_1 as achieved after 7 days', async () => {
      const startedAt = new Date();
      startedAt.setUTCDate(startedAt.getUTCDate() - 8);

      pool.query
        .mockResolvedValueOnce({
          rows: [{ started_at: startedAt.toISOString() }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ cnt: '8' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ first_at: startedAt.toISOString() }],
          rowCount: 1,
        } as any);

      const milestones = await service.getMilestones('user-1', 'contract-1');
      const week1 = milestones.find((m) => m.type === 'WEEK_1');
      expect(week1?.achievedAt).not.toBeNull();
    });
  });

  describe('calculateRelapseRiskScore', () => {
    const setupContract = () => {
      const startedAt = new Date();
      startedAt.setUTCDate(startedAt.getUTCDate() - 15);
      pool.query
        .mockResolvedValueOnce({
          rows: [
            {
              user_id: 'user-1',
              started_at: startedAt.toISOString(),
              strikes: '0',
            },
          ],
          rowCount: 1,
        } as any);
    };

    it('throws for missing contract', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(
        service.calculateRelapseRiskScore('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns LOW risk for active contract with recent proofs', async () => {
      setupContract();
      pool.query
        .mockResolvedValueOnce({
          rows: [
            { d: '2026-07-22' },
            { d: '2026-07-21' },
            { d: '2026-07-20' },
            { d: '2026-07-19' },
            { d: '2026-07-18' },
            { d: '2026-07-17' },
            { d: '2026-07-16' },
          ],
          rowCount: 7,
        } as any)
        .mockResolvedValueOnce({ rows: [{ streak: '15' }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ cnt: '0' }], rowCount: 1 } as any);

      const score = await service.calculateRelapseRiskScore('contract-1');
      expect(score.score).toBeLessThanOrEqual(40);
      expect(['LOW', 'MODERATE']).toContain(score.level);
    });

    it('returns HIGHER risk for day 21 window', async () => {
      const startedAt = new Date();
      startedAt.setUTCDate(startedAt.getUTCDate() - 21);

      pool.query
        .mockResolvedValueOnce({
          rows: [
            {
              user_id: 'user-1',
              started_at: startedAt.toISOString(),
              strikes: '0',
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ d: '2026-07-22' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [{ streak: '20' }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ cnt: '0' }], rowCount: 1 } as any);

      const score = await service.calculateRelapseRiskScore('contract-1');
      expect(score.factors).toContain('day_21_extinction_burst');
      expect(score.score).toBeGreaterThan(20);
    });

    it('returns HIGHER risk with strikes', async () => {
      const startedAt = new Date();
      startedAt.setUTCDate(startedAt.getUTCDate() - 15);

      pool.query
        .mockResolvedValueOnce({
          rows: [
            {
              user_id: 'user-1',
              started_at: startedAt.toISOString(),
              strikes: '3',
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [
            { d: '2026-07-22' },
            { d: '2026-07-21' },
            { d: '2026-07-20' },
          ],
          rowCount: 3,
        } as any)
        .mockResolvedValueOnce({ rows: [{ streak: '3' }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ cnt: '0' }], rowCount: 1 } as any);

      const score = await service.calculateRelapseRiskScore('contract-1');
      expect(score.factors).toContain('multiple_violations');
      expect(score.score).toBeGreaterThan(15);
    });
  });

  describe('getRecentProofCount', () => {
    it('counts distinct proof days', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ cnt: '5' }],
        rowCount: 1,
      } as any);

      const count = await service.getRecentProofCount('user-1', 7);
      expect(count).toBe(5);
    });

    it('defaults to 7 days', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ cnt: '3' }],
        rowCount: 1,
      } as any);

      const count = await service.getRecentProofCount('user-1');
      expect(count).toBe(3);
    });
  });

  describe('getDashboardSummary', () => {
    it('aggregates all fields', async () => {
      const startedAt = new Date();
      startedAt.setUTCDate(startedAt.getUTCDate() - 15);
      const endsAt = new Date();
      endsAt.setUTCDate(endsAt.getUTCDate() + 15);

      pool.query.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT DATE(created_at) AS proof_date')) {
          return {
            rows: [
              { proof_date: '2026-07-22' },
              { proof_date: '2026-07-21' },
            ],
            rowCount: 2,
          };
        }
        if (sql.includes('SELECT started_at FROM contracts')) {
          return {
            rows: [{ started_at: startedAt.toISOString() }],
            rowCount: 1,
          };
        }
        if (sql.includes('SELECT COUNT(*) AS cnt FROM proofs') && sql.includes("status = 'VERIFIED'") && !sql.includes('INTERVAL')) {
          return { rows: [{ cnt: '10' }], rowCount: 1 };
        }
        if (sql.includes('SELECT MIN(created_at)')) {
          return {
            rows: [{ first_at: startedAt.toISOString() }],
            rowCount: 1,
          };
        }
        if (sql.includes('SELECT user_id, started_at, strikes')) {
          return {
            rows: [
              {
                user_id: 'user-1',
                started_at: startedAt.toISOString(),
                strikes: '0',
              },
            ],
            rowCount: 1,
          };
        }
        if (sql.includes('GROUP BY d') && sql.includes('7 days')) {
          return {
            rows: [
              { d: '2026-07-22' },
              { d: '2026-07-21' },
              { d: '2026-07-20' },
              { d: '2026-07-19' },
              { d: '2026-07-18' },
              { d: '2026-07-17' },
              { d: '2026-07-16' },
            ],
            rowCount: 7,
          };
        }
        if (sql.includes('streak')) {
          return { rows: [{ streak: '10' }], rowCount: 1 };
        }
        if (sql.includes('EXTRACT(HOUR')) {
          return { rows: [{ cnt: '0' }], rowCount: 1 };
        }
        if (sql.includes('COUNT(DISTINCT DATE')) {
          return { rows: [{ cnt: '5' }], rowCount: 1 };
        }
        if (sql.includes('ends_at')) {
          return {
            rows: [{ ends_at: endsAt.toISOString() }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      });

      const summary = await service.getDashboardSummary(
        'user-1',
        'contract-1',
      );
      expect(summary).toHaveProperty('streak');
      expect(summary).toHaveProperty('milestones');
      expect(summary).toHaveProperty('riskScore');
      expect(summary).toHaveProperty('recentProofs');
      expect(summary).toHaveProperty('daysRemaining');
      expect(summary.recentProofs).toBe(5);
      expect(summary.streak.currentStreak).toBeGreaterThanOrEqual(0);
      expect(summary.milestones).toHaveLength(7);
    });
  });
});
