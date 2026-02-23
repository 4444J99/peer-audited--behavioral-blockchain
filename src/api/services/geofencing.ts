/**
 * Aegis Protocol: Jurisdictional Geofencing
 *
 * Uses geoip-lite for IP-to-state lookups, falling back gracefully.
 * Jurisdiction classification based on docs/legal/ gambling law analysis.
 */
import geoip from 'geoip-lite';

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

/**
 * Full 50-state + DC classification.
 * - TIER_3 (HARD_BLOCK): States with strict anti-gambling laws or "any chance" doctrine.
 * - TIER_2 (REFUND_ONLY): States requiring specific licenses or material-element doctrine.
 * - TIER_1 (FULL_ACCESS): Predominance doctrine states (default for unlisted).
 */
export const STATE_TIERS: Record<string, JurisdictionTier> = {
    // TIER_3: Hard-blocked — strict anti-gambling / "any chance" states
    'WA': JurisdictionTier.TIER_3,  // Washington — strictest anti-online-gambling
    'AR': JurisdictionTier.TIER_3,  // Arkansas
    'HI': JurisdictionTier.TIER_3,  // Hawaii — no gambling allowed
    'UT': JurisdictionTier.TIER_3,  // Utah — constitutional gambling ban
    'ID': JurisdictionTier.TIER_3,  // Idaho
    'SC': JurisdictionTier.TIER_3,  // South Carolina

    // TIER_2: Restricted — requires licenses or bonding, refund-only mode
    'NY': JurisdictionTier.TIER_2,  // New York — requires bonding for large prizes
    'CT': JurisdictionTier.TIER_2,  // Connecticut — regulated
    'MT': JurisdictionTier.TIER_2,  // Montana — material element doctrine
    'AZ': JurisdictionTier.TIER_2,  // Arizona — DFS licensing required
    'IA': JurisdictionTier.TIER_2,  // Iowa — regulated
    'LA': JurisdictionTier.TIER_2,  // Louisiana — parish-level regulation
    'ME': JurisdictionTier.TIER_2,  // Maine — skill game licensing
    'TN': JurisdictionTier.TIER_2,  // Tennessee — regulated DFS
    'VA': JurisdictionTier.TIER_2,  // Virginia — regulated
    'IN': JurisdictionTier.TIER_2,  // Indiana — regulated
    'PA': JurisdictionTier.TIER_2,  // Pennsylvania — regulated + tax

    // TIER_1: Full access — predominance doctrine / permissive (default)
    'CA': JurisdictionTier.TIER_1,
    'TX': JurisdictionTier.TIER_1,
    'FL': JurisdictionTier.TIER_1,
    'IL': JurisdictionTier.TIER_1,
    'OH': JurisdictionTier.TIER_1,
    'GA': JurisdictionTier.TIER_1,
    'NC': JurisdictionTier.TIER_1,
    'MI': JurisdictionTier.TIER_1,
    'NJ': JurisdictionTier.TIER_1,
    'MA': JurisdictionTier.TIER_1,
    'WI': JurisdictionTier.TIER_1,
    'MN': JurisdictionTier.TIER_1,
    'CO': JurisdictionTier.TIER_1,
    'AL': JurisdictionTier.TIER_1,
    'MD': JurisdictionTier.TIER_1,
    'MO': JurisdictionTier.TIER_1,
    'OK': JurisdictionTier.TIER_1,
    'OR': JurisdictionTier.TIER_1,
    'KY': JurisdictionTier.TIER_1,
    'NV': JurisdictionTier.TIER_1,
    'KS': JurisdictionTier.TIER_1,
    'NE': JurisdictionTier.TIER_1,
    'MS': JurisdictionTier.TIER_1,
    'NM': JurisdictionTier.TIER_1,
    'WV': JurisdictionTier.TIER_1,
    'NH': JurisdictionTier.TIER_1,
    'ND': JurisdictionTier.TIER_1,
    'SD': JurisdictionTier.TIER_1,
    'DE': JurisdictionTier.TIER_1,
    'RI': JurisdictionTier.TIER_1,
    'VT': JurisdictionTier.TIER_1,
    'WY': JurisdictionTier.TIER_1,
    'AK': JurisdictionTier.TIER_1,
    'DC': JurisdictionTier.TIER_1,
};

/**
 * Look up an IP address and return its jurisdiction tier and resolved state.
 * Non-US IPs default to TIER_1 (permissive) with null state.
 */
export function checkJurisdiction(ip: string): { tier: JurisdictionTier; state: string | null } {
    const geo = geoip.lookup(ip);
    if (!geo || geo.country !== 'US') return { tier: JurisdictionTier.TIER_1, state: null };
    const state = geo.region;
    const tier = STATE_TIERS[state] ?? JurisdictionTier.TIER_1;
    return { tier, state };
}
