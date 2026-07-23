import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import { NotificationsService } from '../notifications/notifications.service';

export type ChurnRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ChurnSignal {
  userId: string;
  email: string;
  risk: ChurnRisk;
  signals: string[];
  integrityScore: number;
  daysSinceLastActive: number;
  missedStreak: number;
}

const CHURN_DAYS_WARNING = 7;
const CHURN_DAYS_HIGH = 14;
const CHURN_DAYS_CRITICAL = 30;
const DECLINING_RATE_THRESHOLD = 0.3;
const MIN_INTEGRITY_FOR_ACTIVE = 30;

@Injectable()
export class ChurnDetectionService {
  private readonly logger = new Logger(ChurnDetectionService.name);

  constructor(
    private readonly pool: Pool,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async detectChurnSignals() {
    this.logger.log('Running churn signal detection...');
    const atRisk = await this.scan();
    this.logger.log(`Detected ${atRisk.length} at-risk users`);

    for (const user of atRisk) {
      try {
        await this.notifications.create({
          userId: user.userId,
          type: 'CHURN_WARNING',
          title: this.getChurnTitle(user.risk),
          body: this.getChurnBody(user),
          metadata: {
            risk: user.risk,
            signals: user.signals,
            daysSinceLastActive: user.daysSinceLastActive,
          },
        });
      } catch (err: any) {
        this.logger.error(`Failed to notify user ${user.userId}: ${err.message}`);
      }
    }
  }

  async scan(): Promise<ChurnSignal[]> {
    const users = await this.pool.query(
      `SELECT u.id, u.email, u.integrity_score, u.last_active_at,
              u.consecutive_missed_proofs
       FROM users u
       WHERE u.status = 'ACTIVE'
         AND (u.last_active_at IS NULL OR u.last_active_at < NOW() - make_interval(days => 3))`,
    );

    const signals: ChurnSignal[] = [];

    for (const row of users.rows) {
      const daysSinceLastActive = row.last_active_at
        ? Math.floor((Date.now() - new Date(row.last_active_at).getTime()) / 86400000)
        : 999;

      const userSignals: string[] = [];
      const integrityScore = row.integrity_score ?? 0;

      if (daysSinceLastActive >= CHURN_DAYS_CRITICAL) {
        userSignals.push('No activity in 30+ days');
      } else if (daysSinceLastActive >= CHURN_DAYS_HIGH) {
        userSignals.push('No activity in 14+ days');
      } else if (daysSinceLastActive >= CHURN_DAYS_WARNING) {
        userSignals.push('No activity in 7+ days');
      }

      if (row.consecutive_missed_proofs >= 3) {
        userSignals.push(`${row.consecutive_missed_proofs} consecutive missed proofs`);
      }

      if (integrityScore < MIN_INTEGRITY_FOR_ACTIVE) {
        userSignals.push('Low integrity score');
      }

      const activeContractCount = await this.checkActiveContracts(row.id);
      if (activeContractCount === 0 && daysSinceLastActive > 0) {
        userSignals.push('No active contracts');
      }

      if (daysSinceLastActive > 0) {
        const declining = await this.checkDecliningAttestationRate(row.id);
        if (declining) {
          userSignals.push('Declining attestation rate');
        }
      }

      if (userSignals.length === 0) continue;

      let risk: ChurnRisk = 'LOW';
      if (
        daysSinceLastActive >= CHURN_DAYS_CRITICAL ||
        (daysSinceLastActive >= CHURN_DAYS_HIGH && row.consecutive_missed_proofs >= 3)
      ) {
        risk = 'CRITICAL';
      } else if (daysSinceLastActive >= CHURN_DAYS_HIGH || userSignals.length >= 3) {
        risk = 'HIGH';
      } else if (daysSinceLastActive >= CHURN_DAYS_WARNING || userSignals.length >= 2) {
        risk = 'MEDIUM';
      }

      signals.push({
        userId: row.id,
        email: row.email,
        risk,
        signals: userSignals,
        integrityScore,
        daysSinceLastActive,
        missedStreak: row.consecutive_missed_proofs ?? 0,
      });
    }

    return signals;
  }

  private async checkActiveContracts(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS count FROM contracts WHERE user_id = $1 AND status = 'ACTIVE'`,
      [userId],
    );
    return result.rows[0].count;
  }

  private async checkDecliningAttestationRate(userId: string): Promise<boolean> {
    const rates = await this.pool.query(
      `WITH weekly AS (
         SELECT
           date_trunc('week', a.attestation_date) AS week,
           COUNT(*) FILTER (WHERE a.status IN ('ATTESTED', 'COSIGNED'))::numeric /
             NULLIF(COUNT(*), 0) AS rate
         FROM attestations a
         JOIN contracts c ON c.id = a.contract_id
         WHERE c.user_id = $1
           AND a.attestation_date >= NOW() - INTERVAL '30 days'
         GROUP BY date_trunc('week', a.attestation_date)
         ORDER BY week DESC
         LIMIT 4
       )
       SELECT
         COUNT(*) >= 2 AS has_enough_data,
         (array_agg(rate ORDER BY week))[1] AS latest_rate,
         (array_agg(rate ORDER BY week))[array_length(array_agg(rate ORDER BY week), 1)] AS oldest_rate
       FROM weekly`,
      [userId],
    );

    const row = rates.rows[0];
    if (!row || !row.has_enough_data) return false;

    const latestRate = parseFloat(row.latest_rate);
    const oldestRate = parseFloat(row.oldest_rate);
    return oldestRate > 0 && (oldestRate - latestRate) / oldestRate > DECLINING_RATE_THRESHOLD;
  }

  private getChurnTitle(risk: ChurnRisk): string {
    switch (risk) {
      case 'CRITICAL':
        return 'We miss you — your streak is at risk';
      case 'HIGH':
        return 'Don\'t lose your progress — check in';
      case 'MEDIUM':
        return 'Small step today — keep the chain alive';
      default:
        return 'Your next chapter starts now';
    }
  }

  private getChurnBody(user: ChurnSignal): string {
    const parts: string[] = [];
    if (user.daysSinceLastActive >= 7) {
      parts.push(`${user.daysSinceLastActive} days since your last visit`);
    }
    if (user.missedStreak >= 3) {
      parts.push(`${user.missedStreak} missed proofs in a row`);
    }
    if (user.signals.includes('No active contracts')) {
      parts.push('Create a new contract to restart your journey');
    }
    return parts.join('. ') + '.';
  }
}
