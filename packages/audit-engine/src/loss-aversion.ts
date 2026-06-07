/**
 * Loss Aversion Engine
 *
 * Implements the mathematical core of behavioral physics.
 * Weaponizes the psychological principle of Loss Aversion to ensure contract compliance.
 */

export interface LossAversionConfig {
  baseCoefficient: number;
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
   * Calculates the adjusted penalty multiplier based on current behavioral context.
   * Formula: Multiplier = baseCoefficient * (1 + ln(1 + volatility))
   */
  public calculatePenaltyMultiplier(volatility: number): number {
    const safeVolatility = Math.max(0, volatility);
    const rawMultiplier =
      this.config.baseCoefficient * (1 + Math.log(1 + safeVolatility));

    return Math.min(
      Math.max(rawMultiplier, this.config.minPenaltyMultiplier),
      this.config.maxPenaltyMultiplier,
    );
  }

  /**
   * Determines the "Loss Velocity" - the rate at which loss aversion increases
   * as the deadline approaches.
   */
  public calculateLossVelocity(
    daysRemaining: number,
    totalDays: number,
  ): number {
    if (totalDays <= 0) return 0;
    const elapsedRatio = Math.min(
      1,
      Math.max(0, (totalDays - daysRemaining) / totalDays),
    );
    return Math.pow(elapsedRatio, 2);
  }
}
