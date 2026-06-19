/**
 * Integrity Score Calculation
 *
 * Core formulas for user integrity scoring and Fury reviewer weight computation.
 * Pure functions with zero external dependencies.
 */

export const BASE_INTEGRITY = 50;
export const FRAUD_PENALTY = 15;
export const STRIKE_PENALTY = 20;
export const COMPLETION_BONUS = 5;
export const INTEGRITY_CEILING_HIGH = 500;
export const CEILING_PENALTY_RATE = 0.5;

export const AUDITOR_STAKE_AMOUNT = 200; // cents ($2.00)
export const AUDITOR_HARASSMENT_THRESHOLD = 3;

export interface UserHistory {
  userId: string;
  completedOaths: number;
  fraudStrikes: number;
  failedOaths: number;
  monthsInactive: number;
}

export interface FuryHistory {
  furyId: string;
  successfulAudits: number;
  falseAccusations: number;
  totalAudits: number;
}

/**
 * Calculates a user's Integrity Score (IS) based on behavioral physics.
 * Base (50) + (5 per completed challenge) - (15 per fraud) - (20 per strike) - (1 per inactive month).
 */
export function calculateIntegrity(history: UserHistory): number {
  const base = BASE_INTEGRITY;
  const bonus = history.completedOaths * COMPLETION_BONUS;
  const fraudCost = history.fraudStrikes * FRAUD_PENALTY;
  const strikeCost = history.failedOaths * STRIKE_PENALTY;
  const decay = history.monthsInactive * 1;

  let score = base + bonus - fraudCost - strikeCost - decay;
  score = Math.max(0, score);

  if (score > INTEGRITY_CEILING_HIGH) {
    score =
      INTEGRITY_CEILING_HIGH +
      (score - INTEGRITY_CEILING_HIGH) * CEILING_PENALTY_RATE;
  }

  return Math.round(score);
}

/**
 * Determines what financial tiers a user can access based on their Integrity Score.
 */
export function getAllowedTiers(score: number): string[] {
  if (score < 20) return ["RESTRICTED_MODE"];
  if (score < 50) return ["TIER_1_MICRO_STAKES"];
  if (score < 100) return ["TIER_1_MICRO_STAKES", "TIER_2_STANDARD"];
  if (score < 500)
    return ["TIER_1_MICRO_STAKES", "TIER_2_STANDARD", "TIER_3_HIGH_ROLLER"];
  return [
    "TIER_1_MICRO_STAKES",
    "TIER_2_STANDARD",
    "TIER_3_HIGH_ROLLER",
    "TIER_4_WHALE_VAULTS",
  ];
}

export const FALSE_ACCUSATION_WEIGHT = 3;

/**
 * RD-01: Fury Accuracy Calculation
 * Evaluates how trustworthy a peer reviewer is.
 */
export function calculateAccuracy(history: FuryHistory): number {
  if (history.totalAudits === 0) return 1.0;

  const netSuccess =
    history.successfulAudits -
    history.falseAccusations * FALSE_ACCUSATION_WEIGHT;
  const ratio = netSuccess / history.totalAudits;

  return Math.max(0.0, Math.min(1.0, ratio));
}

/**
 * F-FURY-08: Reviewer Quality Weights
 * Determines the voting power of an auditor based on their reputation.
 */
export function calculateReviewerWeight(history: FuryHistory): number {
  const accuracy = calculateAccuracy(history);

  if (history.totalAudits >= 200 && accuracy >= 0.95) return 2.0;
  if (history.totalAudits >= 50 && accuracy >= 0.9) return 1.5;

  return 1.0;
}

export function shouldDemoteFury(history: FuryHistory): boolean {
  if (history.totalAudits < 10) return false;
  return calculateAccuracy(history) < 0.8;
}

export function getDisplayTier(score: number): string {
  if (score >= 500) return "WHALE";
  if (score >= 100) return "HIGH_ROLLER";
  if (score >= 50) return "STANDARD";
  if (score >= 20) return "MICRO";
  return "RESTRICTED";
}

export function getTierMaxStake(tiers: string[]): number {
  if (tiers.includes("TIER_4_WHALE_VAULTS")) return Infinity;
  if (tiers.includes("TIER_3_HIGH_ROLLER")) return 100000;
  if (tiers.includes("TIER_2_STANDARD")) return 10000;
  if (tiers.includes("TIER_1_MICRO_STAKES")) return 2000;
  return 0;
}

// Fury Consensus Constants
export const FURY_CONSENSUS_AUDITORS = 3;
export const FURY_CONSENSUS_AGREEMENT_REQUIRED = 2;
