export declare enum JurisdictionTier {
    TIER_1 = "FULL_ACCESS",
    TIER_2 = "REFUND_ONLY",
    TIER_3 = "HARD_BLOCK"
}
export declare const STATE_TIERS: Record<string, JurisdictionTier>;
export declare function classifyJurisdiction(geo: {
    country: string;
    region: string;
} | null): {
    tier: JurisdictionTier;
    state: string | null;
};
