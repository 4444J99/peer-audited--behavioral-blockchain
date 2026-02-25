"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FALSE_ACCUSATION_WEIGHT = exports.AUDITOR_HARASSMENT_THRESHOLD = exports.AUDITOR_STAKE_AMOUNT = exports.COMPLETION_BONUS = exports.STRIKE_PENALTY = exports.FRAUD_PENALTY = exports.BASE_INTEGRITY = void 0;
exports.calculateIntegrity = calculateIntegrity;
exports.getAllowedTiers = getAllowedTiers;
exports.calculateAccuracy = calculateAccuracy;
exports.shouldDemoteFury = shouldDemoteFury;
exports.getTierMaxStake = getTierMaxStake;
exports.BASE_INTEGRITY = 50;
exports.FRAUD_PENALTY = 15;
exports.STRIKE_PENALTY = 20;
exports.COMPLETION_BONUS = 5;
exports.AUDITOR_STAKE_AMOUNT = 2.00;
exports.AUDITOR_HARASSMENT_THRESHOLD = 3;
function calculateIntegrity(history) {
    const base = exports.BASE_INTEGRITY;
    const bonus = history.completedOaths * exports.COMPLETION_BONUS;
    const fraudCost = history.fraudStrikes * exports.FRAUD_PENALTY;
    const strikeCost = history.failedOaths * exports.STRIKE_PENALTY;
    const decay = history.monthsInactive * 1;
    const score = base + bonus - fraudCost - strikeCost - decay;
    return Math.max(0, score);
}
function getAllowedTiers(score) {
    if (score < 20)
        return ['RESTRICTED_MODE'];
    if (score < 50)
        return ['TIER_1_MICRO_STAKES'];
    if (score < 100)
        return ['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD'];
    if (score < 500)
        return ['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD', 'TIER_3_HIGH_ROLLER'];
    return ['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD', 'TIER_3_HIGH_ROLLER', 'TIER_4_WHALE_VAULTS'];
}
exports.FALSE_ACCUSATION_WEIGHT = 3;
function calculateAccuracy(history) {
    if (history.totalAudits === 0)
        return 1.0;
    const netSuccess = history.successfulAudits - (history.falseAccusations * exports.FALSE_ACCUSATION_WEIGHT);
    const ratio = netSuccess / history.totalAudits;
    return Math.max(0.0, Math.min(1.0, ratio));
}
function shouldDemoteFury(history) {
    if (history.totalAudits < 10)
        return false;
    return calculateAccuracy(history) < 0.8;
}
function getTierMaxStake(tiers) {
    if (tiers.includes('TIER_4_WHALE_VAULTS'))
        return Infinity;
    if (tiers.includes('TIER_3_HIGH_ROLLER'))
        return 1000;
    if (tiers.includes('TIER_2_STANDARD'))
        return 100;
    if (tiers.includes('TIER_1_MICRO_STAKES'))
        return 20;
    return 0;
}
//# sourceMappingURL=integrity.js.map