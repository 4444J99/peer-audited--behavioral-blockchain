export declare enum OathCategory {
    WEIGHT_MANAGEMENT = "BIOLOGICAL_WEIGHT",
    CARDIOVASCULAR_STAMINA = "BIOLOGICAL_CARDIO",
    GLUCOSE_STABILITY = "BIOLOGICAL_METABOLIC",
    SLEEP_INTEGRITY = "BIOLOGICAL_SLEEP",
    SOBRIETY_HRV = "BIOLOGICAL_SOBRIETY",
    DIGITAL_FASTING = "COGNITIVE_DIGITAL",
    DEEP_WORK_FOCUS = "COGNITIVE_FOCUS",
    INBOX_ZERO = "COGNITIVE_QUEUE",
    LEARNING_RETENTION = "COGNITIVE_LEARNING",
    SALES_VELOCITY = "PROFESSIONAL_SALES",
    DEVELOPER_THROUGHPUT = "PROFESSIONAL_CODE",
    PUNCTUALITY = "PROFESSIONAL_TIME",
    DEEP_WRITING = "CREATIVE_WRITING",
    VISUAL_ARTS = "CREATIVE_ART",
    MUSIC_PRACTICE = "CREATIVE_MUSIC",
    MAKER_BUILD = "CREATIVE_BUILD",
    NUTRITIONAL_TRANSPARENCY = "VISUAL_NUTRITION",
    TIDINESS_MINIMALISM = "VISUAL_ENVIRONMENT",
    PERSONAL_PRESENTATION = "VISUAL_IMAGE",
    ACTIVE_READING = "VISUAL_LITERACY",
    CIVIC_ENGAGEMENT = "SOCIAL_COMMUNITY",
    PHILANTHROPIC_VELOCITY = "SOCIAL_CHARITY",
    FAMILY_PRESENCE = "SOCIAL_CONNECTION",
    NO_CONTACT_BOUNDARY = "RECOVERY_NOCONTACT",
    SUBSTANCE_ABSTINENCE = "RECOVERY_SUBSTANCE",
    BEHAVIORAL_DETOX = "RECOVERY_DETOX",
    ENVIRONMENT_AVOIDANCE = "RECOVERY_AVOIDANCE"
}
export declare enum VerificationMethod {
    HARDWARE_HEALTHKIT = "HEALTHKIT",
    HARDWARE_HEALTHCONNECT = "HEALTHCONNECT",
    API_SCREEN_TIME = "SCREENTIME",
    API_THIRD_PARTY = "EXTERNAL_API",
    FURY_CONSENSUS = "FURY_NETWORK",
    TIME_LAPSE = "TIME_LAPSE_PROOF",
    GPS_GEOFENCE = "GPS",
    FINANCIAL_LEDGER = "LEDGER",
    DAILY_ATTESTATION = "ATTESTATION"
}
export declare const MAX_GRACE_DAYS_PER_MONTH = 2;
export declare const ONBOARDING_BONUS_AMOUNT = 5;
export declare const LOSS_AVERSION_COEFFICIENT = 1.955;
export declare const DOWNSCALE_STRIKE_THRESHOLD = 3;
export declare const FAILURE_COOL_OFF_DAYS = 7;
export declare const MIN_SAFE_BMI = 18.5;
export declare const MAX_WEEKLY_LOSS_VELOCITY_PCT = 0.02;
export declare const MAX_NOCONTACT_DURATION_DAYS = 30;
export declare const MAX_NOCONTACT_TARGETS = 3;
export declare const NOCONTACT_MISS_STRIKE_THRESHOLD = 3;
export declare function validateOathMapping(category: OathCategory, method: VerificationMethod): boolean;
export interface GraceDayResult {
    success: boolean;
    reason?: string;
    newDeadline?: Date;
}
export declare function useGraceDay(graceDaysUsedThisMonth: number, currentEndsAt: Date): GraceDayResult;
export interface OnboardingBonusResult {
    granted: boolean;
    amount: number;
    reason?: string;
}
export declare function grantOnboardingBonus(totalContracts: number): OnboardingBonusResult;
export declare const ACTIVE_OATH_STREAMS: readonly ["COGNITIVE", "PROFESSIONAL", "CREATIVE", "RECOVERY"];
export declare function isOathStreamActive(category: OathCategory): boolean;
