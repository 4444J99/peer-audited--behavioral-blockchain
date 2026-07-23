import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  streakStartDate: Date | null;
}

export interface Milestone {
  type:
    | 'FIRST_PROOF'
    | 'WEEK_1'
    | 'WEEK_2'
    | 'DAY_30'
    | 'DAY_90'
    | 'DAY_180'
    | 'DAY_365';
  title: string;
  achievedAt: Date | null;
  message: string;
}

export interface RelapseRiskScore {
  score: number;
  factors: string[];
  level: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
}

export interface DashboardSummary {
  streak: StreakInfo;
  milestones: Milestone[];
  riskScore: RelapseRiskScore;
  recentProofs: number;
  daysRemaining: number;
}

const MILESTONE_THRESHOLDS: {
  type: Milestone['type'];
  days: number;
  title: string;
  message: string;
}[] = [
  {
    type: 'FIRST_PROOF',
    days: 0,
    title: 'First Proof',
    message: 'Your journey begins.',
  },
  {
    type: 'WEEK_1',
    days: 7,
    title: 'One Week Strong',
    message: 'Seven days in. The hardest part is starting — you did.',
  },
  {
    type: 'WEEK_2',
    days: 14,
    title: 'Two Weeks',
    message: 'Habits start forming around day 14. Keep going.',
  },
  {
    type: 'DAY_30',
    days: 30,
    title: '30 Days',
    message: 'A full month. You are proving something to yourself.',
  },
  {
    type: 'DAY_90',
    days: 90,
    title: '90 Days',
    message: 'The neural pathways are rewiring. You are changing.',
  },
  {
    type: 'DAY_180',
    days: 180,
    title: '180 Days',
    message: 'Six months. This is not willpower anymore — it is identity.',
  },
  {
    type: 'DAY_365',
    days: 365,
    title: 'One Year',
    message: 'A full year. You are proof that recovery is real.',
  },
];

@Injectable()
export class ProgressDashboardService {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
  ) {}

  async getStreakInfo(userId: string): Promise<StreakInfo> {
    const result = await this.pool.query(
      `SELECT DATE(created_at) AS proof_date
       FROM proofs
       WHERE user_id = $1 AND status = 'VERIFIED'
       ORDER BY proof_date DESC`,
      [userId],
    );

    if (result.rows.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        streakStartDate: null,
      };
    }

    const dates: string[] = result.rows.map(
      (r: { proof_date: string }) => r.proof_date,
    );
    const uniqueDates = [...new Set(dates)].sort().reverse();

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    let currentStreak = 0;
    let streakStartDate: Date | null = null;
    const checkDate = new Date(today);

    for (let i = 0; i < 365 * 2; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates.includes(dateStr)) {
        currentStreak++;
        streakStartDate = new Date(checkDate);
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      } else if (i === 0) {
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      } else {
        break;
      }
    }

    let longestStreak = 0;
    let tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffDays =
        (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalDays: uniqueDates.length,
      streakStartDate,
    };
  }

  async getMilestones(
    userId: string,
    contractId: string,
  ): Promise<Milestone[]> {
    const contractResult = await this.pool.query(
      `SELECT started_at FROM contracts WHERE id = $1`,
      [contractId],
    );

    if (contractResult.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    const startedAt = new Date(contractResult.rows[0].started_at);
    const now = new Date();
    const elapsedDays = Math.floor(
      (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const proofCountResult = await this.pool.query(
      `SELECT COUNT(*) AS cnt FROM proofs
       WHERE user_id = $1 AND contract_id = $2 AND status = 'VERIFIED'`,
      [userId, contractId],
    );
    const proofCount = parseInt(proofCountResult.rows[0].cnt, 10);

    const firstProofResult = await this.pool.query(
      `SELECT MIN(created_at) AS first_at FROM proofs
       WHERE user_id = $1 AND contract_id = $2 AND status = 'VERIFIED'`,
      [userId, contractId],
    );
    const firstProofAt = firstProofResult.rows[0].first_at
      ? new Date(firstProofResult.rows[0].first_at)
      : null;

    return MILESTONE_THRESHOLDS.map((threshold) => {
      let achievedAt: Date | null = null;

      if (threshold.type === 'FIRST_PROOF') {
        achievedAt = firstProofAt;
      } else if (elapsedDays >= threshold.days) {
        achievedAt = new Date(startedAt);
        achievedAt.setUTCDate(achievedAt.getUTCDate() + threshold.days);
      }

      return {
        type: threshold.type,
        title: threshold.title,
        achievedAt,
        message: threshold.message,
      };
    });
  }

  async calculateRelapseRiskScore(
    contractId: string,
  ): Promise<RelapseRiskScore> {
    const contractResult = await this.pool.query(
      `SELECT user_id, started_at, strikes FROM contracts WHERE id = $1`,
      [contractId],
    );

    if (contractResult.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    const contract = contractResult.rows[0];
    const userId = contract.user_id;
    const startedAt = new Date(contract.started_at);
    const strikes = parseInt(contract.strikes, 10) || 0;

    const now = new Date();
    const elapsedDays = Math.floor(
      (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const factors: string[] = [];
    let score = 0;

    const recentProofsResult = await this.pool.query(
      `SELECT DATE(created_at) AS d FROM proofs
       WHERE user_id = $1 AND contract_id = $2 AND status = 'VERIFIED'
         AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY d`,
      [userId, contractId],
    );
    const recentDays = recentProofsResult.rows.length;
    const missedDays = 7 - recentDays;
    const frequencyScore = Math.min(30, missedDays * (30 / 7));
    score += frequencyScore;
    if (missedDays >= 3) factors.push('missed_recent_proofs');

    let dayScore = 0;
    if (elapsedDays >= 2 && elapsedDays <= 4) {
      dayScore = 20;
      factors.push('day_3_danger_zone');
    } else if (elapsedDays >= 19 && elapsedDays <= 23) {
      dayScore = 25;
      factors.push('day_21_extinction_burst');
    } else if (elapsedDays < 7) {
      dayScore = 10;
      factors.push('early_contract');
    }
    score += dayScore;

    const streakResult = await this.pool.query(
      `WITH daily AS (
         SELECT DATE(created_at) AS d
         FROM proofs
         WHERE user_id = $1 AND contract_id = $2 AND status = 'VERIFIED'
         ORDER BY d DESC
       )
       SELECT COUNT(*) AS streak FROM (
         SELECT d, d - ROW_NUMBER() OVER (ORDER BY d DESC) AS grp
         FROM daily
       ) sub
       WHERE d >= (SELECT MAX(d) FROM daily) - (ROW_NUMBER() OVER ()) * INTERVAL '1 day'
       GROUP BY grp
       ORDER BY streak DESC
       LIMIT 1`,
      [userId, contractId],
    );
    const currentStreak = streakResult.rows[0]
      ? parseInt(streakResult.rows[0].streak, 10)
      : 0;
    let streakScore = 0;
    if (currentStreak >= 90) {
      streakScore = 15;
      factors.push('long_streak_complacency');
    } else if (currentStreak >= 30) {
      streakScore = 8;
    }
    score += streakScore;

    const lateNightResult = await this.pool.query(
      `SELECT COUNT(*) AS cnt FROM proofs
       WHERE user_id = $1 AND contract_id = $2
         AND EXTRACT(HOUR FROM created_at) BETWEEN 0 AND 4
         AND created_at >= NOW() - INTERVAL '14 days'`,
      [userId, contractId],
    );
    const lateNightCount = parseInt(lateNightResult.rows[0].cnt, 10);
    let timingScore = 0;
    if (lateNightCount >= 3) {
      timingScore = 15;
      factors.push('frequent_late_night_proofs');
    } else if (lateNightCount >= 1) {
      timingScore = 7;
    }
    score += timingScore;

    let violationScore = 0;
    if (strikes >= 3) {
      violationScore = 15;
      factors.push('multiple_violations');
    } else if (strikes >= 1) {
      violationScore = strikes * 5;
      factors.push('prior_violation');
    }
    score += violationScore;

    score = Math.min(100, Math.max(0, score));

    let level: RelapseRiskScore['level'] = 'LOW';
    if (score >= 81) level = 'CRITICAL';
    else if (score >= 61) level = 'HIGH';
    else if (score >= 41) level = 'ELEVATED';
    else if (score >= 21) level = 'MODERATE';

    return { score, factors, level };
  }

  async getRecentProofCount(
    userId: string,
    days: number = 7,
  ): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(DISTINCT DATE(created_at)) AS cnt
       FROM proofs
       WHERE user_id = $1 AND status = 'VERIFIED'
         AND created_at >= NOW() - ($2 || ' days')::INTERVAL`,
      [userId, days.toString()],
    );
    return parseInt(result.rows[0].cnt, 10);
  }

  async getDashboardSummary(
    userId: string,
    contractId: string,
  ): Promise<DashboardSummary> {
    const [streak, milestones, riskScore, recentProofs, contractResult] =
      await Promise.all([
        this.getStreakInfo(userId),
        this.getMilestones(userId, contractId),
        this.calculateRelapseRiskScore(contractId),
        this.getRecentProofCount(userId, 7),
        this.pool.query(
          `SELECT ends_at FROM contracts WHERE id = $1`,
          [contractId],
        ),
      ]);

    const endsAt = new Date(contractResult.rows[0]?.ends_at ?? new Date());
    const daysRemaining = Math.max(
      0,
      Math.floor(
        (endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      ),
    );

    return {
      streak,
      milestones,
      riskScore,
      recentProofs,
      daysRemaining,
    };
  }
}
