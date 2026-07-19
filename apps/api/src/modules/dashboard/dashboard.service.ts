import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

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
}

