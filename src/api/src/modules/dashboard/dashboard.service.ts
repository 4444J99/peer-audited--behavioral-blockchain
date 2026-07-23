import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

const NEVER_MISS_TWICE_MULTIPLIER = 2;

export interface StreakDay {
  date: string;
  attested: boolean;
  graceUsed: boolean;
  chainBroken: boolean;
}

export interface StreakChain {
  days: StreakDay[];
  currentStreak: number;
  longestStreak: number;
  neverMissTwiceActive: boolean;
  penaltyMultiplier: number;
}

/**
 * Platform-wide operational metrics surfaced on the admin dashboard.
 *
 * Monetary fields are integer cents to match the ledger's `entries.amount`
 * (BIGINT cents) convention and avoid floating-point drift. `fraud_rate` is a
 * unit fraction in [0, 1] (multiply by 100 for a percentage).
 */
export interface DashboardMetrics {
  /** Net funds currently held in SYSTEM_ESCROW (credits − debits), in cents. */
  total_staked: number;
  /** Distinct users with at least one ACTIVE contract. */
  active_users: number;
  /** Fraction of successfully-settled contracts captured as a FAIL outcome, in [0, 1]. */
  fraud_rate: number;
  /** Total value of successfully-settled contracts, in cents. */
  payout_volume: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly pool: Pool) {}

  async getProgress(userId: string) {
    const contracts = await this.pool.query(
      `SELECT id, oath_category, status, stake_amount, duration_days, started_at, ends_at,
              (SELECT COUNT(*) FROM attestations WHERE contract_id = contracts.id AND status IN ('ATTESTED', 'COSIGNED')) as streak
       FROM contracts WHERE user_id = $1 AND status = 'ACTIVE'`,
      [userId]
    );

    const vaultStats = await this.pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM entries e 
       JOIN accounts a ON e.credit_account_id = a.id
       WHERE a.name = 'PROTECTED_VAULT' AND e.contract_id IN (SELECT id FROM contracts WHERE user_id = $1)`,
      [userId]
    );

    return {
      activeContracts: contracts.rows,
      protectedVaultBalanceCents: parseInt(vaultStats.rows[0].total),
      summary: {
        totalActiveStakeUsd: contracts.rows.reduce((sum, c) => sum + parseFloat(c.stake_amount), 0),
        longestStreak: Math.max(...contracts.rows.map(c => parseInt(c.streak) || 0), 0),
      }
    };
  }

  async getStreakChain(userId: string): Promise<StreakChain> {
    const data = await this.pool.query(
      `SELECT a.attestation_date, a.status as att_status, c.grace_days_used
       FROM attestations a
       JOIN contracts c ON c.id = a.contract_id
       WHERE c.user_id = $1 AND a.attestation_date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY a.attestation_date DESC`,
      [userId],
    );

    const dayMap = new Map<string, { attested: boolean; graceUsed: boolean }>();
    for (const row of data.rows) {
      const dateStr = row.attestation_date instanceof Date
        ? row.attestation_date.toISOString().slice(0, 10)
        : String(row.attestation_date).slice(0, 10);
      const attested = row.att_status === 'ATTESTED' || row.att_status === 'COSIGNED';
      if (!dayMap.has(dateStr) || attested) {
        dayMap.set(dateStr, { attested, graceUsed: row.grace_days_used > 0 });
      }
    }

    const days: StreakDay[] = [];
    let currentStreak = 0;
    let longestStreak = 0;
    let consecutiveMisses = 0;

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry = dayMap.get(dateStr);

      const attested = entry?.attested ?? false;
      const graceUsed = entry?.graceUsed ?? false;
      const isMiss = !attested && !graceUsed;

      if (isMiss) {
        consecutiveMisses++;
      } else if (attested) {
        consecutiveMisses = 0;
        currentStreak++;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      }

      const day: StreakDay = {
        date: dateStr,
        attested,
        graceUsed,
        chainBroken: consecutiveMisses >= 2,
      };
      days.push(day);
    }

    const neverMissTwiceActive = consecutiveMisses === 0;
    const penaltyMultiplier = neverMissTwiceActive ? 1 : NEVER_MISS_TWICE_MULTIPLIER;

    return {
      days,
      currentStreak,
      longestStreak,
      neverMissTwiceActive,
      penaltyMultiplier,
    };
  }

  /**
   * Aggregates platform-wide operational metrics from the ledger (entries/accounts)
   * and payments (settlement_runs) tables.
   */
  async getMetrics(): Promise<DashboardMetrics> {
    const [staked, activeUsers, settlements] = await Promise.all([
      this.pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN e.credit_account_id = a.id THEN e.amount ELSE 0 END), 0)
           - COALESCE(SUM(CASE WHEN e.debit_account_id = a.id THEN e.amount ELSE 0 END), 0)
             AS total_staked
         FROM accounts a
         LEFT JOIN entries e
           ON e.credit_account_id = a.id OR e.debit_account_id = a.id
         WHERE a.name = 'SYSTEM_ESCROW'`,
      ),
      this.pool.query(
        `SELECT COUNT(DISTINCT user_id) AS active_users
         FROM contracts
         WHERE status = 'ACTIVE'`,
      ),
      this.pool.query(
        `SELECT
           COALESCE(SUM(amount_cents), 0) AS payout_volume,
           COUNT(*) AS settled_count,
           COUNT(*) FILTER (WHERE outcome = 'FAIL') AS fraud_count
         FROM settlement_runs
         WHERE status = 'SUCCESS'`,
      ),
    ]);

    const settledCount = Number.parseInt(String(settlements.rows[0].settled_count), 10);
    const fraudCount = Number.parseInt(String(settlements.rows[0].fraud_count), 10);

    return {
      total_staked: Number.parseInt(String(staked.rows[0].total_staked), 10),
      active_users: Number.parseInt(String(activeUsers.rows[0].active_users), 10),
      fraud_rate: settledCount === 0 ? 0 : fraudCount / settledCount,
      payout_volume: Number.parseInt(String(settlements.rows[0].payout_volume), 10),
    };
  }
}

