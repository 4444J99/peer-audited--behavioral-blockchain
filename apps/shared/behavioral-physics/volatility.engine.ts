/**
 * VolatilityEngine
 * 
 * Manages temporal behavioral multipliers (e.g., Weekend Volatility).
 * Identifies high-risk temporal windows and scales stake requirements accordingly.
 */

export enum RiskWindow {
  STANDARD = 1.0,
  WEEKEND_VIGIL = 1.25, // Friday 18:00 to Monday 06:00
  PEAK_VULNERABILITY = 1.5, // Late night windows (00:00 - 04:00)
}

export class VolatilityEngine {
  /**
   * Returns the risk multiplier for a given date/time.
   */
  public getTemporalMultiplier(date: Date = new Date()): number {
    const day = date.getUTCDay(); // 0 (Sun) to 6 (Sat)
    const hour = date.getUTCHours();

    let multiplier = RiskWindow.STANDARD;

    // Detect Weekend Vigil (Fri 18:00 - Mon 06:00)
    const isFridayNight = day === 5 && hour >= 18;
    const isSaturday = day === 6;
    const isSunday = day === 0;
    const isMondayMorning = day === 1 && hour < 6;

    if (isFridayNight || isSaturday || isSunday || isMondayMorning) {
      multiplier = RiskWindow.WEEKEND_VIGIL;
    }

    // Detect Peak Vulnerability (Late night 00:00 - 04:00)
    if (hour >= 0 && hour < 4) {
      multiplier = Math.max(multiplier, RiskWindow.PEAK_VULNERABILITY);
    }

    return multiplier;
  }

  /**
   * Calculates the "Behavioral Heat" - a combination of temporal risk and user-specific volatility.
   */
  public calculateBehavioralHeat(userVolatility: number, date: Date = new Date()): number {
    const temporalMultiplier = this.getTemporalMultiplier(date);
    return userVolatility * temporalMultiplier;
  }
}
