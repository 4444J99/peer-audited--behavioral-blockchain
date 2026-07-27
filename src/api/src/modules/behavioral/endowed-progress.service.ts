import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';

export interface ProgressState {
  contractId: string;
  realProgress: number;
  endowedBoost: number;
  displayProgress: number;
  currentTier: string;
  nextTierAt: number;
  motivation: string;
}

export interface ProgressTier {
  name: string;
  threshold: number;
  message: string;
  boost: number;
}

const PROGRESS_TIERS: ProgressTier[] = [
  { name: 'Awakening', threshold: 0, message: 'The journey of a thousand miles begins with a single step.', boost: 0.12 },
  { name: 'Commitment', threshold: 0.15, message: 'You chose yourself. That takes courage.', boost: 0.08 },
  { name: 'Momentum', threshold: 0.30, message: 'The hardest part is over. Keep building.', boost: 0.05 },
  { name: 'Resilience', threshold: 0.50, message: 'Halfway there. You are not the same person who started.', boost: 0.03 },
  { name: 'Mastery', threshold: 0.70, message: 'This is who you are now.', boost: 0.02 },
  { name: 'Transcendence', threshold: 0.90, message: 'You made it. This is proof.', boost: 0 },
];

@Injectable()
export class EndowedProgressService {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  getCurrentTier(realProgress: number): ProgressTier {
    let current = PROGRESS_TIERS[0];
    for (const tier of PROGRESS_TIERS) {
      if (realProgress >= tier.threshold) {
        current = tier;
      }
    }
    return current;
  }

  getNextTierProgress(realProgress: number): { nextTier: string; at: number } {
    for (const tier of PROGRESS_TIERS) {
      if (tier.threshold > realProgress) {
        return { nextTier: tier.name, at: tier.threshold };
      }
    }
    return { nextTier: 'Complete', at: 1.0 };
  }

  getMotivationMessage(tier: ProgressTier): string {
    return tier.message;
  }

  async getProgressState(contractId: string): Promise<ProgressState> {
    const result = await this.pool.query(
      `SELECT duration_days, started_at FROM contracts WHERE id = $1`,
      [contractId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    const { duration_days, started_at } = result.rows[0];
    const now = new Date();
    const startedAt = new Date(started_at);
    const elapsedMs = now.getTime() - startedAt.getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    const realProgress = Math.min(1, Math.max(0, elapsedDays / duration_days));

    const tier = this.getCurrentTier(realProgress);
    const nextTier = this.getNextTierProgress(realProgress);
    const displayProgress = Math.min(1, realProgress + tier.boost);

    return {
      contractId,
      realProgress,
      endowedBoost: tier.boost,
      displayProgress,
      currentTier: tier.name,
      nextTierAt: nextTier.at,
      motivation: this.getMotivationMessage(tier),
    };
  }

  async applyDynamicDownscaling(contractId: string): Promise<{ multiplier: number; reason: string }> {
    const result = await this.pool.query(
      `SELECT strikes, duration_days, started_at FROM contracts WHERE id = $1`,
      [contractId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    const { strikes, duration_days, started_at } = result.rows[0];
    const strikesCount = parseInt(strikes, 10) || 0;
    const now = new Date();
    const startedAt = new Date(started_at);
    const elapsedMs = now.getTime() - startedAt.getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    const realProgress = Math.min(1, elapsedDays / duration_days);

    let multiplier = 1.0;
    const reasons: string[] = [];

    if (strikesCount > 0) {
      multiplier *= Math.max(0.5, 1 - strikesCount * 0.1);
      reasons.push(`${strikesCount} prior violation(s)`);
    }

    const dayOfWeek = now.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend && realProgress >= 0.7) {
      multiplier *= 0.85;
      reasons.push('weekend vulnerability in final 30%');
    }

    return {
      multiplier,
      reason: reasons.length > 0 ? reasons.join('; ') : 'no downscaling applied',
    };
  }
}
