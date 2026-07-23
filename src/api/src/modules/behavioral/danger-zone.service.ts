import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

export type DangerWindowType = 'DAY_3' | 'DAY_21' | 'WEEKEND' | 'LATE_NIGHT' | 'HIGH_STREAK_RISK';
export type DangerSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DangerWindow {
  type: DangerWindowType;
  severity: DangerSeverity;
  message: string;
}

export interface ProtectionRecommendation {
  type: string;
  action: string;
  description: string;
}

@Injectable()
export class DangerZoneService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async evaluateDangerWindows(contractId: string): Promise<DangerWindow[]> {
    const days = await this.getContractDayNumber(contractId);
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const hour = now.getUTCHours();
    const windows: DangerWindow[] = [];

    if (days >= 2 && days <= 4) {
      windows.push({
        type: 'DAY_3',
        severity: 'HIGH',
        message: 'The critical first 72 hours',
      });
    }

    if (days >= 19 && days <= 23) {
      windows.push({
        type: 'DAY_21',
        severity: 'CRITICAL',
        message: 'The extinction burst',
      });
    }

    if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
      windows.push({
        type: 'WEEKEND',
        severity: 'MEDIUM',
        message: 'Weekend vulnerability window',
      });
    }

    if (hour >= 0 && hour < 4) {
      windows.push({
        type: 'LATE_NIGHT',
        severity: 'HIGH',
        message: 'Late-night high-risk window',
      });
    }

    const streakResult = await this.pool.query(
      `SELECT COUNT(*)::int AS streak
       FROM attestations
       WHERE contract_id = $1 AND status IN ('ATTESTED', 'COSIGNED')
         AND attestation_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [contractId],
    );
    const streak = streakResult.rows[0]?.streak ?? 0;
    if (streak >= 30) {
      windows.push({
        type: 'HIGH_STREAK_RISK',
        severity: 'HIGH',
        message: 'Complacency risk from long streak',
      });
    }

    return windows;
  }

  async getProtectionRecommendations(dangers: DangerWindow[]): Promise<ProtectionRecommendation[]> {
    return dangers.map((d) => {
      switch (d.type) {
        case 'DAY_3':
          return {
            type: d.type,
            action: 'Schedule a check-in with your accountability partner',
            description: 'The first 72 hours are the hardest — lean on your support network.',
          };
        case 'DAY_21':
          return {
            type: d.type,
            action: 'Increase attestation frequency, consider reducing stakes',
            description: 'The extinction burst is the brain\'s last attempt to revert habits.',
          };
        case 'WEEKEND':
          return {
            type: d.type,
            action: 'Pre-commit your weekend routine, avoid isolation',
            description: 'Weekends carry less structure — plan ahead to stay on track.',
          };
        case 'LATE_NIGHT':
          return {
            type: d.type,
            action: 'Enable do-not-disturb, delete tempting apps',
            description: 'Late-night hours have weaker impulse control.',
          };
        case 'HIGH_STREAK_RISK':
          return {
            type: d.type,
            action: 'Review your original motivation, share your streak with your partner',
            description: 'Long streaks breed complacency — reconnect with your why.',
          };
        default:
          return {
            type: d.type,
            action: 'Stay aware of your current risk factors',
            description: 'Review your contract and check in with your support system.',
          };
      }
    });
  }

  async getContractDayNumber(contractId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT started_at FROM contracts WHERE id = $1`,
      [contractId],
    );
    const startedAt = result.rows[0]?.started_at;
    if (!startedAt) {
      throw new Error(`Contract ${contractId} not found`);
    }
    const elapsed = Date.now() - new Date(startedAt).getTime();
    return Math.floor(elapsed / 86400000);
  }

  async isInDangerZone(contractId: string): Promise<boolean> {
    const windows = await this.evaluateDangerWindows(contractId);
    return windows.length > 0;
  }
}
