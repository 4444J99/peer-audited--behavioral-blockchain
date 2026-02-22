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
  FAMILY_PRESENCE = "SOCIAL_CONNECTION"
}

export enum VerificationMethod {
  HARDWARE_HEALTHKIT = "HEALTHKIT",
  HARDWARE_HEALTHCONNECT = "HEALTHCONNECT",
  API_SCREEN_TIME = "SCREENTIME",
  API_THIRD_PARTY = "EXTERNAL_API",
  FURY_CONSENSUS = "FURY_NETWORK",
  TIME_LAPSE = "TIME_LAPSE_PROOF", // For Creative Stream
  GPS_GEOFENCE = "GPS",
  FINANCIAL_LEDGER = "LEDGER"
}

export const MAX_GRACE_DAYS_PER_MONTH = 2;
export const ONBOARDING_BONUS_AMOUNT = 5.00;

/**
 * BE-01: Loss Aversion Anchor
 * Perceived pain of loss is ~2x pleasure of gain (λ = 1.955).
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
 * Tasks for AI Engineer:
 * 1. Implement 'useGraceDay(contractId)': Deducts 1 token, prevents stake loss for 24h.
 * 2. Implement 'grantOnboardingBonus(userId)': Stripe FBO credit of $5 immediately upon funding.
 * 3. Implement 'isGoalEthical(goalDescription: string): boolean': Use LLM to screen for non-ethical goals.
 * 4. Implement 'validateOathMapping(category: OathCategory, method: VerificationMethod)': Ensures category uses correct oracle.
 */
