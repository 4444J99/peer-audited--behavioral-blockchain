import { Injectable } from "@nestjs/common";
import { LossAversionEngine } from "../../../../shared/behavioral-physics/loss-aversion.engine";
import { VolatilityEngine } from "../../../../shared/behavioral-physics/volatility.engine";

/**
 * RecoveryStatusCalculator
 *
 * Distinct from the canonical RecoveryProtocolService in services/health/,
 * which enforces isolation-risk guardrails on recovery contracts. This class
 * calculates real-time behavioral-status metrics — loss velocity, current
 * multiplier, and risk level — for the dashboard / attestation UI.
 *
 * Restored from the deletion in PR #660. That PR incorrectly classified this
 * file as a "duplicate" of services/health/recovery-protocol.service.ts
 * because of the class-name collision; in fact the two services do
 * different work (guardrail enforcement vs. metric calculation) and this
 * one had no callers only because it was never wired into a module.
 */

export interface RecoveryStatus {
  contractId: string;
  daysRemaining: number;
  currentMultiplier: number;
  lossVelocity: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

@Injectable()
export class RecoveryStatusCalculator {
  private lossEngine = new LossAversionEngine();
  private volatilityEngine = new VolatilityEngine();

  public getStatus(contract: {
    id: string;
    startDate: Date;
    durationDays: number;
    baseVolatility: number;
  }): RecoveryStatus {
    const now = new Date();
    const elapsedMs = now.getTime() - contract.startDate.getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, contract.durationDays - elapsedDays);

    const temporalMultiplier = this.volatilityEngine.getTemporalMultiplier(now);
    const lossVelocity = this.lossEngine.calculateLossVelocity(
      daysRemaining,
      contract.durationDays,
    );

    const currentVolatility = contract.baseVolatility * temporalMultiplier;
    const currentMultiplier =
      this.lossEngine.calculatePenaltyMultiplier(currentVolatility);

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (temporalMultiplier > 1.25 || lossVelocity > 0.7) riskLevel = "HIGH";
    else if (temporalMultiplier > 1.0 || lossVelocity > 0.4)
      riskLevel = "MEDIUM";

    return {
      contractId: contract.id,
      daysRemaining: Math.round(daysRemaining * 10) / 10,
      currentMultiplier: Math.round(currentMultiplier * 1000) / 1000,
      lossVelocity: Math.round(lossVelocity * 100) / 100,
      riskLevel,
    };
  }
}
