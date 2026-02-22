import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MIN_SAFE_BMI, MAX_WEEKLY_LOSS_VELOCITY_PCT } from '../../../shared/libs/behavioral-logic';

@Injectable()
export class AegisProtocolService {
  
  /**
   * Validates if a proposed health/weight loss contract is medically safe to underwrite.
   * Throws 406 Not Acceptable if the contract violates the Aegis Guardrails.
   */
  validateHealthMetrics(
    currentWeightLbs: number, 
    heightInches: number, 
    targetWeightLbs: number, 
    targetDays: number
  ): boolean {
    // 1. Calculate current BMI (Formula: weight (lb) / [height (in)]^2 x 703)
    const currentBmi = (currentWeightLbs / Math.pow(heightInches, 2)) * 703;
    
    if (currentBmi < MIN_SAFE_BMI) {
      throw new HttpException(
        `Aegis Violation: Current BMI (${currentBmi.toFixed(1)}) is strictly below the safe floor of ${MIN_SAFE_BMI}. Contract rejected.`,
        HttpStatus.NOT_ACCEPTABLE
      );
    }

    // 2. Calculate proposed weekly weight loss velocity
    const weightToLose = currentWeightLbs - targetWeightLbs;
    
    // If they aren't trying to lose weight, velocity check is moot
    if (weightToLose <= 0) return true;

    const weeks = targetDays / 7;
    const lossPerWeek = weightToLose / weeks;
    const velocityPct = lossPerWeek / currentWeightLbs;

    if (velocityPct > MAX_WEEKLY_LOSS_VELOCITY_PCT) {
      throw new HttpException(
        `Aegis Violation: Proposed weight loss velocity (${(velocityPct * 100).toFixed(1)}%/week) strictly exceeds the safe maximum of ${(MAX_WEEKLY_LOSS_VELOCITY_PCT * 100).toFixed(1)}%/week. Contract rejected.`,
        HttpStatus.NOT_ACCEPTABLE
      );
    }

    return true; // Contract is medically safe to underwrite
  }
}
