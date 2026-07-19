/**
 * Aegis Protocol: Jurisdictional Geofencing
 *
 * Jurisdiction classification based on docs/legal/ gambling law analysis.
 * IP-to-state lookup is handled by GeofenceService (injectable, testable).
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

/**
 * Full 50-state + DC classification.
 * - TIER_3 (HARD_BLOCK): States with strict anti-gambling laws or "any chance" doctrine.
 * - TIER_2 (REFUND_ONLY): States requiring specific licenses or material-element doctrine.
 * - TIER_1 (FULL_ACCESS): Predominance doctrine states (explicitly listed below).
 *
 * SH7 — Fail-closed default: an unlisted / unknown US state is NOT granted TIER_1.
 * `classifyJurisdiction` defaults any state not present in this map to TIER_3
 * (HARD_BLOCK). Every TIER_1 jurisdiction must be enumerated here explicitly; do
 * NOT "fix" the default to TIER_1 (that would open unauthorized cross-border /
 * unclassified-jurisdiction activity).
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
 * Classify a resolved geo result into a jurisdiction tier.
 * Safety-First (Fail-Closed): Non-US or unknown geos default to TIER_3 (HARD_BLOCK).
 * Phase Beta P0-004: Harden jurisdiction policy to prevent unauthorized cross-border activity.
 * IP-to-geo resolution is the caller's responsibility (see GeofenceService).
 */
export function classifyJurisdiction(geo: { country: string; region: string } | null): { tier: JurisdictionTier; state: string | null } {
    // Unknown or non-US locations are hard-blocked by default
    if (!geo || geo.country !== 'US') return { tier: JurisdictionTier.TIER_3, state: null };

    // Normalize the state code (trim + uppercase) so values like " ut " or "ca"
    // resolve to the correct tier instead of silently missing the lookup.
    const state = normalizeStateCode(geo.region);
    if (!state) return { tier: JurisdictionTier.TIER_3, state: null };

    // Unknown US states (e.g. military bases, territories) are hard-blocked by default
    const tier = STATE_TIERS[state] ?? JurisdictionTier.TIER_3;

    return { tier, state };
}

/**
 * Map of full US state/territory names → canonical 2-letter codes, so a geo
 * provider that returns names (e.g. "California") still resolves to the correct
 * tier instead of failing closed and hard-blocking a legitimate TIER_1 user.
 */
const STATE_NAME_TO_CODE: Record<string, string> = {
    ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR', CALIFORNIA: 'CA',
    COLORADO: 'CO', CONNECTICUT: 'CT', DELAWARE: 'DE', FLORIDA: 'FL', GEORGIA: 'GA',
    HAWAII: 'HI', IDAHO: 'ID', ILLINOIS: 'IL', INDIANA: 'IN', IOWA: 'IA',
    KANSAS: 'KS', KENTUCKY: 'KY', LOUISIANA: 'LA', MAINE: 'ME', MARYLAND: 'MD',
    MASSACHUSETTS: 'MA', MICHIGAN: 'MI', MINNESOTA: 'MN', MISSISSIPPI: 'MS', MISSOURI: 'MO',
    MONTANA: 'MT', NEBRASKA: 'NE', NEVADA: 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', OHIO: 'OH',
    OKLAHOMA: 'OK', OREGON: 'OR', PENNSYLVANIA: 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD', TENNESSEE: 'TN', TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT',
    VIRGINIA: 'VA', WASHINGTON: 'WA', 'WEST VIRGINIA': 'WV', WISCONSIN: 'WI', WYOMING: 'WY',
    'DISTRICT OF COLUMBIA': 'DC',
};

/**
 * Normalize a raw state/region code into a canonical 2-letter key.
 *
 * SH8 — strict validation: only a 2-letter code (after trim/uppercase) or a known
 * full state name is accepted. Any other input (free text, ZIP, garbage) returns
 * null so callers fail closed (most-restrictive tier) rather than passing an
 * unvalidated string through to the tier lookup. We deliberately do NOT pass
 * arbitrary non-empty strings: a 2-letter check plus the name map keeps honest
 * TIER_1 users working when a provider returns names, without weakening fail-closed.
 */
export function normalizeStateCode(code: string | null | undefined): string | null {
    if (code == null) return null;
    const normalized = String(code).trim().toUpperCase();
    if (normalized.length === 0) return null;
    // Exact 2-letter code (A–Z only).
    if (/^[A-Z]{2}$/.test(normalized)) return normalized;
    // Full state name → code.
    if (Object.prototype.hasOwnProperty.call(STATE_NAME_TO_CODE, normalized)) {
        return STATE_NAME_TO_CODE[normalized];
    }
    return null;
}
