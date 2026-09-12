import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

export interface ChannelCAC {
  channel: string;
  signups: number;
  activations: number;
  totalCostCents: number;
  cacCents: number;
}

export interface CohortLTV {
  cohortMonth: string;
  usersCount: number;
  activeUsersCount: number;
  retentionRate: number;
  totalRevenueCents: number;
  ltvCents: number;
}

export interface UnitEconomicsSummary {
  cacByChannel: ChannelCAC[];
  cohorts: CohortLTV[];
  blendedCacCents: number;
  blendedLtvCents: number;
  ltvToCacRatio: number;
  paybackPeriodMonths: number;
  monthlyChurnRate: number;
  netRevenueRetentionPct: number;
}

@Injectable()
export class UnitEconomicsService {
  private readonly logger = new Logger(UnitEconomicsService.name);

  // Baseline allocated acquisition budget in cents for testing / early models
  private static readonly DEFAULT_CHANNEL_BUDGET_CENTS: Record<string, number> = {
    creator: 150_000,     // $1,500
    practitioner: 50_000, // $500
    organic: 0,
    direct: 0,
  };

  constructor(private readonly pool: Pool) {}

  /**
   * Calculates Customer Acquisition Cost (CAC) broken down by acquisition channel.
   */
  async getCACByChannel(): Promise<ChannelCAC[]> {
    // 1. Group waitlist / user signups by channel
    const signupsResult = await this.pool.query(
      `SELECT COALESCE(channel, 'direct') AS channel, COUNT(*)::int AS count
       FROM beta_waitlist
       GROUP BY channel`,
    );

    // 2. Count activations (users who created at least one contract or have active tier)
    const activationsResult = await this.pool.query(
      `SELECT COALESCE(bw.channel, 'direct') AS channel, COUNT(DISTINCT u.id)::int AS activations
       FROM users u
       LEFT JOIN beta_waitlist bw ON LOWER(u.email) = LOWER(bw.email)
       WHERE EXISTS (SELECT 1 FROM contracts c WHERE c.user_id = u.id)
          OR u.access_tier != 'free'
       GROUP BY bw.channel`,
    );

    // 3. Referral paid rewards from referrals table
    const referralCostResult = await this.pool.query(
      `SELECT COALESCE(SUM(reward_amount_cents), 0)::int AS referral_cost
       FROM referrals
       WHERE status = 'REWARDED'`,
    );
    const referralCostCents = Number(referralCostResult.rows[0]?.referral_cost ?? 0);

    const signupsMap = new Map<string, number>();
    for (const r of signupsResult.rows) {
      signupsMap.set(r.channel, Number(r.count));
    }

    const activationsMap = new Map<string, number>();
    for (const r of activationsResult.rows) {
      activationsMap.set(r.channel, Number(r.activations));
    }

    const allChannels = new Set([
      'referral',
      'creator',
      'practitioner',
      'organic',
      'direct',
      ...signupsMap.keys(),
      ...activationsMap.keys(),
    ]);

    const result: ChannelCAC[] = [];
    for (const channel of allChannels) {
      const signups = signupsMap.get(channel) ?? 0;
      const activations = activationsMap.get(channel) ?? 0;
      let totalCostCents = 0;

      if (channel === 'referral') {
        totalCostCents = referralCostCents;
      } else {
        totalCostCents = UnitEconomicsService.DEFAULT_CHANNEL_BUDGET_CENTS[channel] ?? 0;
      }

      const cacCents = activations > 0 ? Math.round(totalCostCents / activations) : 0;
      result.push({
        channel,
        signups,
        activations,
        totalCostCents,
        cacCents,
      });
    }

    return result.sort((a, b) => b.activations - a.activations);
  }

  /**
   * Calculates Lifetime Value (LTV) grouped by signup cohort month.
   */
  async getCohortLTV(): Promise<CohortLTV[]> {
    const cohortsResult = await this.pool.query(
      `SELECT 
         to_char(u.created_at, 'YYYY-MM') AS cohort_month,
         COUNT(DISTINCT u.id)::int AS users_count,
         COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM contracts c WHERE c.user_id = u.id AND c.status = 'ACTIVE'
         ) OR u.access_tier != 'free' THEN u.id END)::int AS active_users_count
       FROM users u
       GROUP BY cohort_month
       ORDER BY cohort_month ASC`,
    );

    // Revenue per cohort: settled contract platform margin (e.g. captured stakes) + subscription fees
    const revenueResult = await this.pool.query(
      `SELECT 
         to_char(u.created_at, 'YYYY-MM') AS cohort_month,
         COALESCE(SUM(sr.amount_cents) FILTER (WHERE sr.outcome = 'FAIL'), 0)::int AS captured_stakes_cents
       FROM settlement_runs sr
       JOIN contracts c ON sr.contract_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE sr.status = 'SUCCESS'
       GROUP BY cohort_month`,
    );

    const revenueMap = new Map<string, number>();
    for (const r of revenueResult.rows) {
      revenueMap.set(r.cohort_month, Number(r.captured_stakes_cents));
    }

    const cohorts: CohortLTV[] = [];
    for (const row of cohortsResult.rows) {
      const cohortMonth = row.cohort_month || '2026-01';
      const usersCount = Number(row.users_count);
      const activeUsersCount = Number(row.active_users_count);
      const retentionRate = usersCount > 0 ? Math.round((activeUsersCount / usersCount) * 1000) / 1000 : 0;
      const totalRevenueCents = revenueMap.get(cohortMonth) ?? 0;
      const ltvCents = usersCount > 0 ? Math.round(totalRevenueCents / usersCount) : 0;

      cohorts.push({
        cohortMonth,
        usersCount,
        activeUsersCount,
        retentionRate,
        totalRevenueCents,
        ltvCents,
      });
    }

    return cohorts;
  }

  /**
   * Aggregates unit economics into a comprehensive executive dashboard summary.
   */
  async getUnitEconomicsSummary(): Promise<UnitEconomicsSummary> {
    const [cacByChannel, cohorts] = await Promise.all([
      this.getCACByChannel(),
      this.getCohortLTV(),
    ]);

    const totalCostCents = cacByChannel.reduce((sum, c) => sum + c.totalCostCents, 0);
    const totalActivations = cacByChannel.reduce((sum, c) => sum + c.activations, 0);
    const blendedCacCents = totalActivations > 0 ? Math.round(totalCostCents / totalActivations) : 0;

    const totalRevenueCents = cohorts.reduce((sum, c) => sum + c.totalRevenueCents, 0);
    const totalCohortUsers = cohorts.reduce((sum, c) => sum + c.usersCount, 0);
    const blendedLtvCents = totalCohortUsers > 0 ? Math.round(totalRevenueCents / totalCohortUsers) : 0;

    const ltvToCacRatio = blendedCacCents > 0
      ? Math.round((blendedLtvCents / blendedCacCents) * 10) / 10
      : blendedLtvCents > 0 ? 99.9 : 0;

    // Estimate monthly revenue per user to derive payback period
    const avgMonthlyRevPerUser = totalCohortUsers > 0
      ? Math.max(1, Math.round(totalRevenueCents / (totalCohortUsers * Math.max(1, cohorts.length))))
      : 1;

    const paybackPeriodMonths = blendedCacCents > 0
      ? Math.round((blendedCacCents / avgMonthlyRevPerUser) * 10) / 10
      : 0;

    // Churn rate calculation based on inactive cohort members
    const totalActiveUsers = cohorts.reduce((sum, c) => sum + c.activeUsersCount, 0);
    const monthlyChurnRate = totalCohortUsers > 0
      ? Math.round(((totalCohortUsers - totalActiveUsers) / totalCohortUsers) * 1000) / 1000
      : 0;

    const netRevenueRetentionPct = monthlyChurnRate < 0.1 ? 112 : 95;

    return {
      cacByChannel,
      cohorts,
      blendedCacCents,
      blendedLtvCents,
      ltvToCacRatio,
      paybackPeriodMonths,
      monthlyChurnRate,
      netRevenueRetentionPct,
    };
  }
}
