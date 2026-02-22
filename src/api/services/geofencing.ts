/**
 * Aegis Protocol: Jurisdictional Geofencing
 * 
 * Tasks for AI Engineer:
 * 1. Integrate 'MaxMind GeoLite2' or similar IP-lookup.
 * 2. Implement checkJurisdiction(ip: string): boolean.
 * 3. Hard-block 'Any Chance' states where chance element risk is too high.
 */

/**
 * CG-06: Jurisdiction Tiers
 * TIER_1: All features allowed (Predominance states).
 * TIER_2: Refund-only mode enforced (Material element states).
 * TIER_3: Hard-blocked (Any chance states).
 */
export enum JurisdictionTier {
    TIER_1 = 'FULL_ACCESS',
    TIER_2 = 'REFUND_ONLY',
    TIER_3 = 'HARD_BLOCK'
}

export const STATE_TIERS: Record<string, JurisdictionTier> = {
    'WA': JurisdictionTier.TIER_3,
    'AR': JurisdictionTier.TIER_3,
    'NY': JurisdictionTier.TIER_2, // Example: NY requires bonding for large prizes.
    'CA': JurisdictionTier.TIER_1
};
