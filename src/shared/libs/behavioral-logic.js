"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVE_OATH_STREAMS = exports.NOCONTACT_MISS_STRIKE_THRESHOLD = exports.MAX_NOCONTACT_TARGETS = exports.MAX_NOCONTACT_DURATION_DAYS = exports.MAX_WEEKLY_LOSS_VELOCITY_PCT = exports.MIN_SAFE_BMI = exports.FAILURE_COOL_OFF_DAYS = exports.DOWNSCALE_STRIKE_THRESHOLD = exports.LOSS_AVERSION_COEFFICIENT = exports.ONBOARDING_BONUS_AMOUNT = exports.MAX_GRACE_DAYS_PER_MONTH = exports.VerificationMethod = exports.OathCategory = void 0;
exports.validateOathMapping = validateOathMapping;
exports.useGraceDay = useGraceDay;
exports.grantOnboardingBonus = grantOnboardingBonus;
exports.isOathStreamActive = isOathStreamActive;
var OathCategory;
(function (OathCategory) {
    OathCategory["WEIGHT_MANAGEMENT"] = "BIOLOGICAL_WEIGHT";
    OathCategory["CARDIOVASCULAR_STAMINA"] = "BIOLOGICAL_CARDIO";
    OathCategory["GLUCOSE_STABILITY"] = "BIOLOGICAL_METABOLIC";
    OathCategory["SLEEP_INTEGRITY"] = "BIOLOGICAL_SLEEP";
    OathCategory["SOBRIETY_HRV"] = "BIOLOGICAL_SOBRIETY";
    OathCategory["DIGITAL_FASTING"] = "COGNITIVE_DIGITAL";
    OathCategory["DEEP_WORK_FOCUS"] = "COGNITIVE_FOCUS";
    OathCategory["INBOX_ZERO"] = "COGNITIVE_QUEUE";
    OathCategory["LEARNING_RETENTION"] = "COGNITIVE_LEARNING";
    OathCategory["SALES_VELOCITY"] = "PROFESSIONAL_SALES";
    OathCategory["DEVELOPER_THROUGHPUT"] = "PROFESSIONAL_CODE";
    OathCategory["PUNCTUALITY"] = "PROFESSIONAL_TIME";
    OathCategory["DEEP_WRITING"] = "CREATIVE_WRITING";
    OathCategory["VISUAL_ARTS"] = "CREATIVE_ART";
    OathCategory["MUSIC_PRACTICE"] = "CREATIVE_MUSIC";
    OathCategory["MAKER_BUILD"] = "CREATIVE_BUILD";
    OathCategory["NUTRITIONAL_TRANSPARENCY"] = "VISUAL_NUTRITION";
    OathCategory["TIDINESS_MINIMALISM"] = "VISUAL_ENVIRONMENT";
    OathCategory["PERSONAL_PRESENTATION"] = "VISUAL_IMAGE";
    OathCategory["ACTIVE_READING"] = "VISUAL_LITERACY";
    OathCategory["CIVIC_ENGAGEMENT"] = "SOCIAL_COMMUNITY";
    OathCategory["PHILANTHROPIC_VELOCITY"] = "SOCIAL_CHARITY";
    OathCategory["FAMILY_PRESENCE"] = "SOCIAL_CONNECTION";
    OathCategory["NO_CONTACT_BOUNDARY"] = "RECOVERY_NOCONTACT";
    OathCategory["SUBSTANCE_ABSTINENCE"] = "RECOVERY_SUBSTANCE";
    OathCategory["BEHAVIORAL_DETOX"] = "RECOVERY_DETOX";
    OathCategory["ENVIRONMENT_AVOIDANCE"] = "RECOVERY_AVOIDANCE";
})(OathCategory || (exports.OathCategory = OathCategory = {}));
var VerificationMethod;
(function (VerificationMethod) {
    VerificationMethod["HARDWARE_HEALTHKIT"] = "HEALTHKIT";
    VerificationMethod["HARDWARE_HEALTHCONNECT"] = "HEALTHCONNECT";
    VerificationMethod["API_SCREEN_TIME"] = "SCREENTIME";
    VerificationMethod["API_THIRD_PARTY"] = "EXTERNAL_API";
    VerificationMethod["FURY_CONSENSUS"] = "FURY_NETWORK";
    VerificationMethod["TIME_LAPSE"] = "TIME_LAPSE_PROOF";
    VerificationMethod["GPS_GEOFENCE"] = "GPS";
    VerificationMethod["FINANCIAL_LEDGER"] = "LEDGER";
    VerificationMethod["DAILY_ATTESTATION"] = "ATTESTATION";
})(VerificationMethod || (exports.VerificationMethod = VerificationMethod = {}));
exports.MAX_GRACE_DAYS_PER_MONTH = 2;
exports.ONBOARDING_BONUS_AMOUNT = 5.00;
exports.LOSS_AVERSION_COEFFICIENT = 1.955;
exports.DOWNSCALE_STRIKE_THRESHOLD = 3;
exports.FAILURE_COOL_OFF_DAYS = 7;
exports.MIN_SAFE_BMI = 18.5;
exports.MAX_WEEKLY_LOSS_VELOCITY_PCT = 0.02;
exports.MAX_NOCONTACT_DURATION_DAYS = 30;
exports.MAX_NOCONTACT_TARGETS = 3;
exports.NOCONTACT_MISS_STRIKE_THRESHOLD = 3;
const OATH_METHOD_MAP = {
    BIOLOGICAL: [VerificationMethod.HARDWARE_HEALTHKIT, VerificationMethod.HARDWARE_HEALTHCONNECT],
    COGNITIVE: [VerificationMethod.API_SCREEN_TIME, VerificationMethod.API_THIRD_PARTY],
    PROFESSIONAL: [VerificationMethod.API_THIRD_PARTY, VerificationMethod.FINANCIAL_LEDGER],
    CREATIVE: [VerificationMethod.TIME_LAPSE, VerificationMethod.FURY_CONSENSUS],
    VISUAL: [VerificationMethod.FURY_CONSENSUS, VerificationMethod.GPS_GEOFENCE],
    SOCIAL: [VerificationMethod.FURY_CONSENSUS, VerificationMethod.GPS_GEOFENCE],
    RECOVERY: [VerificationMethod.DAILY_ATTESTATION, VerificationMethod.API_SCREEN_TIME, VerificationMethod.FURY_CONSENSUS],
};
function validateOathMapping(category, method) {
    const categoryValue = category;
    const stream = categoryValue.split('_')[0];
    const allowedMethods = OATH_METHOD_MAP[stream];
    if (!allowedMethods)
        return false;
    return allowedMethods.includes(method);
}
function useGraceDay(graceDaysUsedThisMonth, currentEndsAt) {
    if (graceDaysUsedThisMonth >= exports.MAX_GRACE_DAYS_PER_MONTH) {
        return { success: false, reason: `Maximum ${exports.MAX_GRACE_DAYS_PER_MONTH} grace days per month exceeded` };
    }
    const newDeadline = new Date(currentEndsAt.getTime() + 24 * 60 * 60 * 1000);
    return { success: true, newDeadline };
}
function grantOnboardingBonus(totalContracts) {
    if (totalContracts > 0) {
        return { granted: false, amount: 0, reason: 'User already has prior contracts' };
    }
    return { granted: true, amount: exports.ONBOARDING_BONUS_AMOUNT };
}
exports.ACTIVE_OATH_STREAMS = [
    'COGNITIVE',
    'PROFESSIONAL',
    'CREATIVE',
    'RECOVERY',
];
function isOathStreamActive(category) {
    const stream = category.split('_')[0];
    return exports.ACTIVE_OATH_STREAMS.includes(stream);
}
//# sourceMappingURL=behavioral-logic.js.map