"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATE_TIERS = exports.JurisdictionTier = void 0;
exports.classifyJurisdiction = classifyJurisdiction;
var JurisdictionTier;
(function (JurisdictionTier) {
    JurisdictionTier["TIER_1"] = "FULL_ACCESS";
    JurisdictionTier["TIER_2"] = "REFUND_ONLY";
    JurisdictionTier["TIER_3"] = "HARD_BLOCK";
})(JurisdictionTier || (exports.JurisdictionTier = JurisdictionTier = {}));
exports.STATE_TIERS = {
    'WA': JurisdictionTier.TIER_3,
    'AR': JurisdictionTier.TIER_3,
    'HI': JurisdictionTier.TIER_3,
    'UT': JurisdictionTier.TIER_3,
    'ID': JurisdictionTier.TIER_3,
    'SC': JurisdictionTier.TIER_3,
    'NY': JurisdictionTier.TIER_2,
    'CT': JurisdictionTier.TIER_2,
    'MT': JurisdictionTier.TIER_2,
    'AZ': JurisdictionTier.TIER_2,
    'IA': JurisdictionTier.TIER_2,
    'LA': JurisdictionTier.TIER_2,
    'ME': JurisdictionTier.TIER_2,
    'TN': JurisdictionTier.TIER_2,
    'VA': JurisdictionTier.TIER_2,
    'IN': JurisdictionTier.TIER_2,
    'PA': JurisdictionTier.TIER_2,
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
function classifyJurisdiction(geo) {
    if (!geo || geo.country !== 'US')
        return { tier: JurisdictionTier.TIER_1, state: null };
    const state = geo.region;
    const tier = exports.STATE_TIERS[state] ?? JurisdictionTier.TIER_1;
    return { tier, state };
}
//# sourceMappingURL=geofencing.js.map