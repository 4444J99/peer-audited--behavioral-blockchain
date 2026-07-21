import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';

const TARGET_COMPLETION_RATE_LOW = 0.80;
const TARGET_COMPLETION_RATE_HIGH = 0.85;
const CALIBRATION_WINDOW_DAYS = 14;
const PATIENCE_GUARDIAN_MAX_STAKE_PCT = 0.05;
const DEFAULT_INCOME_CENTS = 500000;

export interface CalibrationResult {
  streak: 'escalate' | 'deescalate' | 'stable';
  completionRate: number;
  sampleSize: number;
  adjustmentCents?: number;
}

@Injectable()
export class DifficultyCalibrationService {
  private readonly logger = new Logger(DifficultyCalibrationService.name);

  constructor(private readonly pool: Pool) {}

  @Cron(CronExpression.EVERY_WEEK)
  async calibrate() {
    this.logger.log('Running Goldilocks difficulty calibration...');
    const windows = await this.computeCalibrationWindows();
    for (const w of windows) {
      this.logger.log(
        `Calibration: rate=${(w.completionRate * 100).toFixed(1)}% streak=${w.streak} (n=${w.sampleSize})`,
      );
    }
  }

  async computeCalibrationWindows(): Promise<CalibrationResult[]> {
    const tiers = [
      { label: 'entry', min: 0, max: 1000 },
      { label: 'standard', min: 1001, max: 5000 },
      { label: 'serious', min: 5001, max: 25000 },
    ];

    const results: CalibrationResult[] = [];

    for (const tier of tiers) {
      const data = await this.pool.query(
        `WITH recent AS (
           SELECT c.id, c.status, c.stake_amount
           FROM contracts c
           WHERE c.created_at >= NOW() - make_interval(days => $1)
             AND c.stake_amount::int BETWEEN $2 AND $3
         )
         SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed
         FROM recent`,
        [CALIBRATION_WINDOW_DAYS, tier.min, tier.max],
      );

      const total = data.rows[0].total;
      const completed = data.rows[0].completed;

      if (total < 10) {
        results.push({ streak: 'stable', completionRate: 0, sampleSize: total });
        continue;
      }

      const rate = completed / total;
      let streak: CalibrationResult['streak'] = 'stable';

      if (rate > TARGET_COMPLETION_RATE_HIGH) {
        streak = 'escalate';
      } else if (rate < TARGET_COMPLETION_RATE_LOW) {
        streak = 'deescalate';
      }

      results.push({
        streak,
        completionRate: rate,
        sampleSize: total,
        adjustmentCents: streak === 'escalate' ? 500 : streak === 'deescalate' ? -500 : undefined,
      });
    }

    return results;
  }

  async checkPatienceGuardian(
    userId: string,
    requestedStakeCents: number,
  ): Promise<{ blocked: boolean; reason?: string; maxStakeCents?: number }> {
    const contractCount = await this.pool.query(
      `SELECT COUNT(*)::int AS count FROM contracts WHERE user_id = $1`,
      [userId],
    );

    if (contractCount.rows[0].count > 0) return { blocked: false };

    const incomeCents = process.env.DEFAULT_USER_INCOME_CENTS
      ? parseInt(process.env.DEFAULT_USER_INCOME_CENTS, 10)
      : DEFAULT_INCOME_CENTS;

    const maxSafe = Math.round(incomeCents * PATIENCE_GUARDIAN_MAX_STAKE_PCT);
    if (requestedStakeCents > maxSafe) {
      return {
        blocked: true,
        reason: `Patience Guardian: first contract stake ($${(requestedStakeCents / 100).toFixed(2)}) exceeds 5% of income ($${(maxSafe / 100).toFixed(2)})`,
        maxStakeCents: maxSafe,
      };
    }

    return { blocked: false };
  }
}
