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
    const MAX_STAKE_LIMIT = 500; // Hard cap to prevent emotional gambling
    const MIN_DURATION_DAYS = 7; // Minimum time to build a habit/break a cycle
    
    // 1. Guard against emotional "revenge staking" or impulsive gambling
    if (stakeAmount > MAX_STAKE_LIMIT) {
      throw new HttpException(
        `Aegis Violation: Proposed stake ($${stakeAmount}) exceeds the absolute psychological safety ceiling of $${MAX_STAKE_LIMIT}. Contract rejected to prevent emotional self-harm.`,
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
    if (pastFailures >= 3 && stakeAmount > 50) {
      throw new HttpException(
        `Aegis Velocity Check: After ${pastFailures} recent contract failures, your maximum allowed stake is strictly capped at $50 to prevent a financial downward spiral.`,
        HttpStatus.NOT_ACCEPTABLE
      );
    }
    
    // 4. Score-based limits (Low integrity score restricts high stakes)
    if (integrityScore < 40 && stakeAmount > 100) {
         throw new HttpException(
           `Aegis Integrity Check: A low Integrity Score (${integrityScore}) restricts stakes to a maximum of $100 until peer trust is rebuilt over time.`,
           HttpStatus.NOT_ACCEPTABLE
        );
    }

    return true; // Contract is psychologically safe to underwrite
  }
}
