import { Injectable } from '@nestjs/common';
import { LossAversionEngine } from '../../../../shared/behavioral-physics/loss-aversion.engine';
import { VolatilityEngine } from '../../../../shared/behavioral-physics/volatility.engine';

/**
 * RecoveryProtocolService
 * 
 * Manages the active state of recovery contracts.
 * Calculates dynamic multipliers and "Loss Velocity" to provide 
 * real-time feedback to the user.
 */

export interface RecoveryStatus {
  contractId: string;
  daysRemaining: number;
  currentMultiplier: number;
  lossVelocity: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

@Injectable()
export class RecoveryProtocolService {
  private lossEngine = new LossAversionEngine();
  private volatilityEngine = new VolatilityEngine();

  /**
   * Calculates the real-time behavioral status of a contract.
   */
  public getStatus(contract: { id: string; startDate: Date; durationDays: number; baseVolatility: number }): RecoveryStatus {
    const now = new Date();
    const elapsedMs = now.getTime() - contract.startDate.getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, contract.durationDays - elapsedDays);

    const temporalMultiplier = this.volatilityEngine.getTemporalMultiplier(now);
    const lossVelocity = this.lossEngine.calculateLossVelocity(daysRemaining, contract.durationDays);
    
    // Combine base volatility with temporal risk
    const currentVolatility = contract.baseVolatility * temporalMultiplier;
    const currentMultiplier = this.lossEngine.calculatePenaltyMultiplier(currentVolatility);

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (temporalMultiplier > 1.25 || lossVelocity > 0.7) riskLevel = 'HIGH';
    else if (temporalMultiplier > 1.0 || lossVelocity > 0.4) riskLevel = 'MEDIUM';

    return {
      contractId: contract.id,
      daysRemaining: Math.round(daysRemaining * 10) / 10,
      currentMultiplier: Math.round(currentMultiplier * 1000) / 1000,
      lossVelocity: Math.round(lossVelocity * 100) / 100,
      riskLevel,
    };
  }
}
