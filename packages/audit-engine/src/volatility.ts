/**
 * Volatility Engine
 *
 * Manages temporal behavioral multipliers (e.g., Weekend Volatility).
 * Identifies high-risk temporal windows and scales stake requirements accordingly.
 */

export enum RiskWindow {
  STANDARD = 1.0,
  WEEKEND_VIGIL = 1.25,
  PEAK_VULNERABILITY = 1.5,
}

export class VolatilityEngine {
  /**
   * Returns the risk multiplier for a given date/time.
   */
  public getTemporalMultiplier(date: Date = new Date()): number {
    const day = date.getUTCDay();
    const hour = date.getUTCHours();

    let multiplier = RiskWindow.STANDARD;

    const isFridayNight = day === 5 && hour >= 18;
    const isSaturday = day === 6;
    const isSunday = day === 0;
    const isMondayMorning = day === 1 && hour < 6;

    if (isFridayNight || isSaturday || isSunday || isMondayMorning) {
      multiplier = RiskWindow.WEEKEND_VIGIL;
    }

    if (hour >= 0 && hour < 4) {
      multiplier = Math.max(multiplier, RiskWindow.PEAK_VULNERABILITY);
    }

    return multiplier;
  }

  /**
   * Calculates the "Behavioral Heat" - a combination of temporal risk
   * and user-specific volatility.
   */
  public calculateBehavioralHeat(
    userVolatility: number,
    date: Date = new Date(),
  ): number {
    const temporalMultiplier = this.getTemporalMultiplier(date);
    return userVolatility * temporalMultiplier;
  }
}
