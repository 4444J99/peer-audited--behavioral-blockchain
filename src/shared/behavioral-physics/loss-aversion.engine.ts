/**
 * LossAversionEngine
 * 
 * Implements the mathematical core of behavioral physics for the Styx ecosystem.
 * Weaponizes the psychological principle of Loss Aversion to ensure contract compliance.
 */

export interface LossAversionConfig {
  baseCoefficient: number; // The core multiplier (standard: 1.955)
  minPenaltyMultiplier: number;
  maxPenaltyMultiplier: number;
}

export const DEFAULT_CONFIG: LossAversionConfig = {
  baseCoefficient: 1.955,
  minPenaltyMultiplier: 1.5,
  maxPenaltyMultiplier: 5.0,
};

export class LossAversionEngine {
  private config: LossAversionConfig;

  constructor(config: Partial<LossAversionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculates the adjusted penalty multiplier based on the stake and current behavioral context.
   * Formula: Multiplier = baseCoefficient * (1 + ln(1 + volatility))
   * 
   * @param baseStake The initial financial deposit.
   * @param volatility Behavioral volatility score (0.0 to 1.0).
   * @returns The dynamic penalty multiplier.
   */
  public calculatePenaltyMultiplier(volatility: number): number {
    const rawMultiplier = this.config.baseCoefficient * (1 + Math.log(1 + volatility));
    
    // Clamp between min and max
    return Math.min(
      Math.max(rawMultiplier, this.config.minPenaltyMultiplier),
      this.config.maxPenaltyMultiplier
    );
  }

  /**
   * Determines the "Loss Velocity" - the rate at which loss aversion increases as the deadline approaches.
   */
  public calculateLossVelocity(daysRemaining: number, totalDays: number): number {
    const elapsedRatio = (totalDays - daysRemaining) / totalDays;
    // Exponential curve: velocity increases as time runs out
    return Math.pow(elapsedRatio, 2);
  }
}
