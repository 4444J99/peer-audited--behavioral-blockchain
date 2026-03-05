/**
 * Behavioral Logic: The Kernel of Oaths & Physics
 * 
 * This file defines the exhaustive taxonomy of behaviors tracked by Styx.
 */

export enum OathCategory {
  // 1. Biological Stream (Hardware Oracle)
  WEIGHT_MANAGEMENT = "BIOLOGICAL_WEIGHT",
  CARDIOVASCULAR_STAMINA = "BIOLOGICAL_CARDIO",
  GLUCOSE_STABILITY = "BIOLOGICAL_METABOLIC",
  SLEEP_INTEGRITY = "BIOLOGICAL_SLEEP",
  SOBRIETY_HRV = "BIOLOGICAL_SOBRIETY",

  // 2. Cognitive Stream (Device Oracle)
  DIGITAL_FASTING = "COGNITIVE_DIGITAL",
  DEEP_WORK_FOCUS = "COGNITIVE_FOCUS",
  INBOX_ZERO = "COGNITIVE_QUEUE",
  LEARNING_RETENTION = "COGNITIVE_LEARNING",

  // 3. Professional Stream (API Oracle)
  SALES_VELOCITY = "PROFESSIONAL_SALES",
  DEVELOPER_THROUGHPUT = "PROFESSIONAL_CODE",
  PUNCTUALITY = "PROFESSIONAL_TIME",

  // 4. Creative Stream (The Muse) - Proof of Process
  DEEP_WRITING = "CREATIVE_WRITING",
  VISUAL_ARTS = "CREATIVE_ART",
  MUSIC_PRACTICE = "CREATIVE_MUSIC",
  MAKER_BUILD = "CREATIVE_BUILD",

  // 5. Environmental Stream (Fury Audited)
  NUTRITIONAL_TRANSPARENCY = "VISUAL_NUTRITION",
  TIDINESS_MINIMALISM = "VISUAL_ENVIRONMENT",
  PERSONAL_PRESENTATION = "VISUAL_IMAGE",
  ACTIVE_READING = "VISUAL_LITERACY",

  // 6. Character Stream (Multi-Oracle)
  CIVIC_ENGAGEMENT = "SOCIAL_COMMUNITY",
  PHILANTHROPIC_VELOCITY = "SOCIAL_CHARITY",
  FAMILY_PRESENCE = "SOCIAL_CONNECTION",

  // 7. Recovery Stream (Abstinence Oracle)
  NO_CONTACT_BOUNDARY = "RECOVERY_NOCONTACT",
  SUBSTANCE_ABSTINENCE = "RECOVERY_SUBSTANCE",
  BEHAVIORAL_DETOX = "RECOVERY_DETOX",
  ENVIRONMENT_AVOIDANCE = "RECOVERY_AVOIDANCE",
}

export enum VerificationMethod {
  HARDWARE_HEALTHKIT = "HEALTHKIT",
  HARDWARE_HEALTHCONNECT = "HEALTHCONNECT",
  API_SCREEN_TIME = "SCREENTIME",
  API_THIRD_PARTY = "EXTERNAL_API",
  FURY_CONSENSUS = "FURY_NETWORK",
  TIME_LAPSE = "TIME_LAPSE_PROOF", // For Creative Stream
  GPS_GEOFENCE = "GPS",
  FINANCIAL_LEDGER = "LEDGER",
  DAILY_ATTESTATION = "ATTESTATION",
}

export const MAX_GRACE_DAYS_PER_MONTH = 2;
export const ONBOARDING_BONUS_AMOUNT = 500; // cents ($5.00)

/**
 * AEGIS-04: Dispute Grace Period
 * Hours allowed to file a dispute before final stake liquidation.
 */
export const DISPUTE_GRACE_PERIOD_HOURS = 24;

/**
 * BE-01: Loss Aversion Anchor
 * Perceived pain of loss is ~2x pleasure of gain (λ = 1.955).
 * Reserved: Dynamic stake messaging (Phase Omega)
 */
export const LOSS_AVERSION_COEFFICIENT = 1.955;

/**
 * BE-05: Dynamic Downscaling Threshold
 */
export const DOWNSCALE_STRIKE_THRESHOLD = 3;

/**
 * CG-04: Cool-Off Period
 * Forced lockout days after a failure spree.
 */
export const FAILURE_COOL_OFF_DAYS = 7;

/**
 * AEGIS-01: Medical Guardrails
 */
export const MIN_SAFE_BMI = 18.5;
export const MAX_WEEKLY_LOSS_VELOCITY_PCT = 0.02;

/**
 * RECOVERY-01: Recovery Stream Guardrails
 * Forces re-evaluation cadence and prevents isolation patterns.
 */
export const MAX_NOCONTACT_DURATION_DAYS = 30;
export const MAX_NOCONTACT_TARGETS = 3;
export const NOCONTACT_MISS_STRIKE_THRESHOLD = 3;

/**
 * F-UX-09: Resilience Badge System
 * Psychological reframing of failure as a pivot point.
 */
export enum BadgeType {
  PHOENIX_RECOVERY = 'PHOENIX_RECOVERY', // Completed contract after a failure
  CONSISTENCY_KING = 'CONSISTENCY_KING', // 30-day streak
  FURY_MASTER = 'FURY_MASTER', // >200 audits with high accuracy
  EARLY_ADOPTER = 'EARLY_ADOPTER', // Beta participant
}

export interface Badge {
  type: BadgeType;
  grantedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Oracle mapping: which verification methods are allowed for each oath stream.
 * BIOLOGICAL requires hardware oracles; COGNITIVE uses device APIs; etc.
 */
const OATH_METHOD_MAP: Record<string, VerificationMethod[]> = {
  BIOLOGICAL: [VerificationMethod.HARDWARE_HEALTHKIT, VerificationMethod.HARDWARE_HEALTHCONNECT],
  COGNITIVE: [VerificationMethod.API_SCREEN_TIME, VerificationMethod.API_THIRD_PARTY],
  PROFESSIONAL: [VerificationMethod.API_THIRD_PARTY, VerificationMethod.FINANCIAL_LEDGER],
  CREATIVE: [VerificationMethod.TIME_LAPSE, VerificationMethod.FURY_CONSENSUS],
  VISUAL: [VerificationMethod.FURY_CONSENSUS, VerificationMethod.GPS_GEOFENCE],
  SOCIAL: [VerificationMethod.FURY_CONSENSUS, VerificationMethod.GPS_GEOFENCE],
  RECOVERY: [VerificationMethod.DAILY_ATTESTATION, VerificationMethod.API_SCREEN_TIME, VerificationMethod.FURY_CONSENSUS],
};

/**
 * Validates that an oath category uses a correct oracle/verification method.
 * Returns true if the mapping is valid, false if the method is not allowed for the stream.
 */
export function validateOathMapping(category: OathCategory, method: VerificationMethod): boolean {
  const categoryValue = category as string;
  // Extract the stream prefix (e.g., "BIOLOGICAL" from "BIOLOGICAL_WEIGHT")
  const stream = categoryValue.split('_')[0];
  const allowedMethods = OATH_METHOD_MAP[stream];

  if (!allowedMethods) return false;
  return allowedMethods.includes(method);
}

export interface GraceDayResult {
  success: boolean;
  reason?: string;
  newDeadline?: Date;
}

/**
 * Uses one grace day for a contract — extends the deadline by 24 hours.
 * Caller must pass the current grace_days_used count and the current ends_at.
 * Returns the new deadline if successful, or a rejection reason.
 */
export function useGraceDay(
  graceDaysUsedThisMonth: number,
  currentEndsAt: Date,
): GraceDayResult {
  if (graceDaysUsedThisMonth >= MAX_GRACE_DAYS_PER_MONTH) {
    return { success: false, reason: `Maximum ${MAX_GRACE_DAYS_PER_MONTH} grace days per month exceeded` };
  }
  const newDeadline = new Date(currentEndsAt.getTime() + 24 * 60 * 60 * 1000);
  return { success: true, newDeadline };
}

export interface OnboardingBonusResult {
  granted: boolean;
  amount: number;
  reason?: string;
}

/**
 * Determines if a user qualifies for the onboarding bonus ($5 credit on first contract).
 * Caller must pass the user's total contract count.
 */
export function grantOnboardingBonus(totalContracts: number): OnboardingBonusResult {
  if (totalContracts > 0) {
    return { granted: false, amount: 0, reason: 'User already has prior contracts' };
  }
  return { granted: true, amount: ONBOARDING_BONUS_AMOUNT };
}

/**
 * DEPRECATED: Goal ethics screening has been moved to
 * src/api/services/intelligence/goal-ethics.service.ts
 * to fix the shared → api dependency inversion.
 * Import GoalEthicsService from the API layer instead.
 */

/** Active oath streams supported in MVP */
export const ACTIVE_OATH_STREAMS = [
  'BIOLOGICAL',
  'COGNITIVE',
  'PROFESSIONAL',
  'CREATIVE',
  'VISUAL',
  'SOCIAL',
  'RECOVERY',
] as const;

/** Check if an oath category is supported in the current MVP */
export function isOathStreamActive(category: OathCategory): boolean {
  const stream = (category as string).split('_')[0];
  return (ACTIVE_OATH_STREAMS as readonly string[]).includes(stream);
}
