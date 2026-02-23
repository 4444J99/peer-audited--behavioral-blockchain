export const BASE_INTEGRITY = 50;
export const FRAUD_PENALTY = 15;
export const STRIKE_PENALTY = 20;
export const COMPLETION_BONUS = 5;

// Reserved: Fury bounty economy (Phase Omega)
export const AUDITOR_STAKE_AMOUNT = 2.00;
export const AUDITOR_HARASSMENT_THRESHOLD = 3;

// Base Models
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
 * Base (50) + (+5 per challenge) - (-15 per fraud) - (-20 per strike)
 * Also applies -1 point decay per inactive month.
 */
export function calculateIntegrity(history: UserHistory): number {
  const base = BASE_INTEGRITY;
  const bonus = history.completedOaths * COMPLETION_BONUS;
  const fraudCost = history.fraudStrikes * FRAUD_PENALTY;
  const strikeCost = history.failedOaths * STRIKE_PENALTY;
  const decay = history.monthsInactive * 1; // 1 point decay per month

  const score = base + bonus - fraudCost - strikeCost - decay;
  
  // Floor at 0, ceiling is theoretically infinite but realistically ~10k+
  return Math.max(0, score);
}

/**
 * Determines what financial tiers a user can access based on their Integrity Score.
 */
export function getAllowedTiers(score: number): string[] {
  if (score < 20) return ['RESTRICTED_MODE']; // Essentially Shadowbanned
  if (score < 50) return ['TIER_1_MICRO_STAKES']; // Under $20
  if (score < 100) return ['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD']; // Up to $100
  if (score < 500) return ['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD', 'TIER_3_HIGH_ROLLER']; // Up to $1000
  return ['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD', 'TIER_3_HIGH_ROLLER', 'TIER_4_WHALE_VAULTS']; // Unlimited
}

/**
 * RD-01: Fury Accuracy Calculation
 * Evaluates how trustworthy a peer reviewer is.
 */
export const FALSE_ACCUSATION_WEIGHT = 3;

export function calculateAccuracy(history: FuryHistory): number {
  if (history.totalAudits === 0) return 1.0; // Benefit of doubt for new Furies

  // Weighted calculation mathematically punishing false claims 3x
  const netSuccess = history.successfulAudits - (history.falseAccusations * FALSE_ACCUSATION_WEIGHT);
  const ratio = netSuccess / history.totalAudits;

  // Clamp between 0.0 and 1.0
  return Math.max(0.0, Math.min(1.0, ratio));
}

export function shouldDemoteFury(history: FuryHistory): boolean {
  // Triggers demotion if accuracy falls below 80% after a 10 case burn-in period.
  if (history.totalAudits < 10) return false;
  return calculateAccuracy(history) < 0.8;
}

/**
 * Returns the maximum stake amount for a given set of allowed tiers.
 */
export function getTierMaxStake(tiers: string[]): number {
  if (tiers.includes('TIER_4_WHALE_VAULTS')) return Infinity;
  if (tiers.includes('TIER_3_HIGH_ROLLER')) return 1000;
  if (tiers.includes('TIER_2_STANDARD')) return 100;
  if (tiers.includes('TIER_1_MICRO_STAKES')) return 20;
  return 0;
}
