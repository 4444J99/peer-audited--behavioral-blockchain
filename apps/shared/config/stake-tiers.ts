/**
 * Stake Tiers and KYC Thresholds
 *
 * Defines the relationship between financial risk (stake amount) and the
 * required identity verification (KYC). This is the SINGLE source of truth for
 * "at what amount does a user have to be KYC-verified".
 *
 * NOTE: This is a DIFFERENT axis from the integrity-score stake caps in
 * `../libs/integrity.ts` (`getTierMaxStake` / `getAllowedTiers`), which decide
 * "how large a stake a user's behavioral integrity score permits". The numbers
 * here (KYC thresholds) intentionally do not match the integrity caps there.
 * Do not treat the `maxAmountCents` below as a hard stake limit — it is only the
 * upper bound of a KYC bracket.
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
 *
 * SH6 — Boundary semantics (chosen; confirm if business intent differs):
 * The `maxAmountCents` of a tier is treated as the EXCLUSIVE upper bound, so an
 * amount exactly AT a threshold escalates to the next (stricter) tier. Concretely:
 *   - exactly $20.00 (2000c)  -> TIER_2 (KYC required), NOT TIER_1
 *   - exactly $500.00 (50000c) -> TIER_3 (KYC required)
 * Rationale: for a real-money compliance gate it is safer to require KYC AT the
 * threshold than to let a stake sitting exactly on the line slip into the lower,
 * no-KYC bracket. (Previously `<=` placed at-threshold stakes in the lower tier.)
 * The final TIER_3 has `maxAmountCents: Infinity`, which `<` still matches for any
 * finite amount, so the function always resolves a tier.
 */
export function getRequiredTier(amountCents: number): TierConfig {
  const tier = STAKE_TIERS.find(t => amountCents < t.maxAmountCents);
  return tier || STAKE_TIERS[STAKE_TIERS.length - 1];
}

/**
 * Validates if a user's verification status meets the tier requirements.
 */
export function isKycRequired(amountCents: number): boolean {
  return getRequiredTier(amountCents).requiresKyc;
}
