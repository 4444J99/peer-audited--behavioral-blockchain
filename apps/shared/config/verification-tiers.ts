/**
 * Verification Tier Escalation
 *
 * Defines proof-verification requirements that escalate based on stake amount
 * and risk signals. This is a LEGAL MANDATE for consumer-on-consumer fraud
 * prevention (source: legal--consultation-personal-goals.md, legal--performance-wagering.md).
 *
 * Separate axis from:
 * - KYC tiers (stake-tiers.ts) — identity verification thresholds
 * - Integrity tiers (integrity.ts) — behavioral score stake caps
 *
 * Tier 1 (STANDARD): Two-photo system (full-body + metric close-up)
 * Tier 2 (ELEVATED): Continuous unedited video weigh-in
 * Tier 3 (HIGH_STAKES): Human referee review + anomaly detection
 */

export enum VerificationTier {
  STANDARD = "STANDARD",
  ELEVATED = "ELEVATED",
  HIGH_STAKES = "HIGH_STAKES",
}

export interface VerificationTierConfig {
  tier: VerificationTier;
  maxStakeCents: number;
  requiresVideo: boolean;
  requiresHumanReview: boolean;
  requiresAnomalyDetection: boolean;
  description: string;
}

export const VERIFICATION_TIERS: VerificationTierConfig[] = [
  {
    tier: VerificationTier.STANDARD,
    maxStakeCents: 5000, // $50.00
    requiresVideo: false,
    requiresHumanReview: false,
    requiresAnomalyDetection: false,
    description: "Two-photo system: full-body photo + close-up of metric",
  },
  {
    tier: VerificationTier.ELEVATED,
    maxStakeCents: 10000, // $100.00
    requiresVideo: true,
    requiresHumanReview: false,
    requiresAnomalyDetection: false,
    description:
      "Mandatory unedited continuous video weigh-in (face → body → metric)",
  },
  {
    tier: VerificationTier.HIGH_STAKES,
    maxStakeCents: Infinity,
    requiresVideo: true,
    requiresHumanReview: true,
    requiresAnomalyDetection: true,
    description:
      "Human referee review + anomaly detection (pHash, EXIF, metadata)",
  },
];

/** Risk-based escalation thresholds */
export const RISK_ESCALATION = {
  /** Integrity score below this → auto-elevate one tier */
  INTEGRITY_SCORE_THRESHOLD: 50,
  /** Number of fraud strikes → auto-elevate one tier */
  FRAUD_STRIKE_THRESHOLD: 1,
  /** pHash duplicate detected → auto-elevate to HIGH_STAKES */
  PHASH_DUPLICATE_DIRECT: true,
} as const;

/**
 * Returns the verification tier required for a given stake amount.
 * Boundary semantics: amount AT threshold escalates to next tier (exclusive upper bound).
 */
export function getVerificationTier(
  stakeAmountCents: number,
): VerificationTier {
  const config = VERIFICATION_TIERS.find(
    (t) => stakeAmountCents < t.maxStakeCents,
  );
  return config?.tier ?? VerificationTier.HIGH_STAKES;
}

/**
 * Returns the verification tier config for a given tier enum.
 */
export function getVerificationTierConfig(
  tier: VerificationTier,
): VerificationTierConfig {
  return (
    VERIFICATION_TIERS.find((t) => t.tier === tier) ??
    VERIFICATION_TIERS[VERIFICATION_TIERS.length - 1]
  );
}

/**
 * Determines the effective verification tier after risk-based escalation.
 * Starts with the stake-based tier and escalates if risk signals are present.
 *
 * @param stakeAmountCents - The contract stake amount
 * @param integrityScore - The user's current integrity score (optional)
 * @param fraudStrikes - Number of prior fraud strikes (optional)
 * @param hasPhashDuplicate - Whether a pHash duplicate was detected (optional)
 */
export function getEffectiveVerificationTier(
  stakeAmountCents: number,
  integrityScore?: number,
  fraudStrikes?: number,
  hasPhashDuplicate?: boolean,
): VerificationTier {
  let tier = getVerificationTier(stakeAmountCents);

  // pHash duplicate → direct to HIGH_STAKES
  if (hasPhashDuplicate && RISK_ESCALATION.PHASH_DUPLICATE_DIRECT) {
    return VerificationTier.HIGH_STAKES;
  }

  // Low integrity score → escalate one tier
  if (
    integrityScore !== undefined &&
    integrityScore < RISK_ESCALATION.INTEGRITY_SCORE_THRESHOLD
  ) {
    tier = escalateTier(tier);
  }

  // Prior fraud strikes → escalate one tier
  if (
    fraudStrikes !== undefined &&
    fraudStrikes >= RISK_ESCALATION.FRAUD_STRIKE_THRESHOLD
  ) {
    tier = escalateTier(tier);
  }

  return tier;
}

/**
 * Escalates a tier by one level. HIGH_STAKES is the ceiling.
 */
function escalateTier(tier: VerificationTier): VerificationTier {
  switch (tier) {
    case VerificationTier.STANDARD:
      return VerificationTier.ELEVATED;
    case VerificationTier.ELEVATED:
      return VerificationTier.HIGH_STAKES;
    case VerificationTier.HIGH_STAKES:
      return VerificationTier.HIGH_STAKES;
  }
}

/**
 * Validates that submitted proof media meets the tier requirements.
 * Returns null if valid, or an error message if not.
 */
export function validateProofMedia(
  tier: VerificationTier,
  hasVideo: boolean,
): string | null {
  const config = getVerificationTierConfig(tier);

  if (config.requiresVideo && !hasVideo) {
    return `Tier ${tier} requires continuous video proof. Photo-only submissions are not accepted for stakes at this level.`;
  }

  return null;
}
