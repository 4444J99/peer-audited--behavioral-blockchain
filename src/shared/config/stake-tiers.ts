/**
 * Stake Tiers and KYC Thresholds
 * 
 * Defines the relationship between financial risk (stake amount) and
 * the required identity verification (KYC).
 */

export enum StakeTier {
  TIER_1 = 'TIER_1_MICRO', // No KYC required
  TIER_2 = 'TIER_2_STANDARD', // KYC required
  TIER_3 = 'TIER_3_PREMIUM', // Enhanced Due Diligence (Future)
}

export interface TierConfig {
  tier: StakeTier;
  maxAmountCents: number;
  requiresKyc: boolean;
}

export const STAKE_TIERS: TierConfig[] = [
  {
    tier: StakeTier.TIER_1,
    maxAmountCents: 2000, // $20.00
    requiresKyc: false,
  },
  {
    tier: StakeTier.TIER_2,
    maxAmountCents: 50000, // $500.00
    requiresKyc: true,
  },
  {
    tier: StakeTier.TIER_3,
    maxAmountCents: Infinity,
    requiresKyc: true,
  },
];

/**
 * Returns the minimum tier required for a given amount in cents.
 */
export function getRequiredTier(amountCents: number): TierConfig {
  const tier = STAKE_TIERS.find(t => amountCents <= t.maxAmountCents);
  return tier || STAKE_TIERS[STAKE_TIERS.length - 1];
}

/**
 * Validates if a user's verification status meets the tier requirements.
 */
export function isKycRequired(amountCents: number): boolean {
  return getRequiredTier(amountCents).requiresKyc;
}
