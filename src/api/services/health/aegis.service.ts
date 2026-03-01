import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MIN_SAFE_BMI, MAX_WEEKLY_LOSS_VELOCITY_PCT } from '../../../shared/libs/behavioral-logic';

@Injectable()
export class AegisProtocolService {
  
  /**
   * Validates if a proposed behavioral contract is psychologically and financially safe.
   * Throws 406 Not Acceptable if the contract violates the Aegis Guardrails for Phase 1 (No Contact).
   */
  validatePsychologicalGuardrails(
    stakeAmount: number,
    durationDays: number,
    integrityScore: number,
    pastFailures: number
  ): boolean {
    const MAX_STAKE_LIMIT = 50000; // cents ($500) — hard cap to prevent emotional gambling
    const MIN_DURATION_DAYS = 7; // Minimum time to build a habit/break a cycle

    // 1. Guard against emotional "revenge staking" or impulsive gambling
    if (stakeAmount > MAX_STAKE_LIMIT) {
      throw new HttpException(
        `Aegis Violation: Proposed stake (${stakeAmount}¢) exceeds the absolute psychological safety ceiling of ${MAX_STAKE_LIMIT}¢. Contract rejected to prevent emotional self-harm.`,
        HttpStatus.NOT_ACCEPTABLE
      );
    }

    // 2. Guard against meaningless, too-short contracts
    if (durationDays < MIN_DURATION_DAYS) {
      throw new HttpException(
         `Aegis Violation: Proposed duration (${durationDays} days) is beneath the clinical threshold (${MIN_DURATION_DAYS} days) required to interrupt habituated neural pathways. Contract rejected.`,
         HttpStatus.NOT_ACCEPTABLE
      );
    }

    // 3. Dynamic scaling based on previous consecutive failures (Downward spiral prevention)
    if (pastFailures >= 3 && stakeAmount > 5000) {
      throw new HttpException(
        `Aegis Velocity Check: After ${pastFailures} recent contract failures, your maximum allowed stake is strictly capped at 5000¢ to prevent a financial downward spiral.`,
        HttpStatus.NOT_ACCEPTABLE
      );
    }

    // 4. Score-based limits (Low integrity score restricts high stakes)
    if (integrityScore < 40 && stakeAmount > 10000) {
      throw new HttpException(
        `Aegis Integrity Check: A low Integrity Score (${integrityScore}) restricts stakes to a maximum of 10000¢ until peer trust is rebuilt over time.`,
        HttpStatus.NOT_ACCEPTABLE
      );
    }

    return true; // Contract is psychologically safe to underwrite
  }

  /**
   * Validates health metrics for BIOLOGICAL oath categories.
   * Enforces BMI floor (18.5) and weekly weight loss velocity cap (2%).
   */
  validateHealthMetrics(
    healthMetrics?: {
      currentWeightLbs: number;
      heightInches: number;
      targetWeightLbs: number;
    },
    durationDays?: number,
  ): boolean {
    if (!healthMetrics) return true; // Non-biological oaths skip

    // BMI floor check: BMI = (weight_lbs / height_in^2) * 703
    const bmiCurrent = (healthMetrics.currentWeightLbs / (healthMetrics.heightInches ** 2)) * 703;
    if (bmiCurrent < MIN_SAFE_BMI) {
      throw new HttpException(
        `Aegis Health Guard: Current BMI (${bmiCurrent.toFixed(1)}) is below the medical safety floor of ${MIN_SAFE_BMI}. Contract rejected.`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    // Weekly weight loss velocity cap
    if (durationDays && durationDays >= 7) {
      const weeks = durationDays / 7;
      const totalLoss = healthMetrics.currentWeightLbs - healthMetrics.targetWeightLbs;
      if (totalLoss > 0) {
        const weeklyLossRate = totalLoss / weeks / healthMetrics.currentWeightLbs;
        if (weeklyLossRate > MAX_WEEKLY_LOSS_VELOCITY_PCT) {
          throw new HttpException(
            `Aegis Velocity Guard: Projected weekly weight loss (${(weeklyLossRate * 100).toFixed(1)}%) exceeds the safe maximum of ${MAX_WEEKLY_LOSS_VELOCITY_PCT * 100}% per week.`,
            HttpStatus.NOT_ACCEPTABLE,
          );
        }
      }
    }

    return true;
  }
}
