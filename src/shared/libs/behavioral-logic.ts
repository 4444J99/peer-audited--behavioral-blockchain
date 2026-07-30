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
export const REFERRAL_REWARD_AMOUNT = 500; // cents ($5.00) — referrer credit per successful referral
export const MAX_MONTHLY_REFERRALS = 20; // max rewarded referrals per month per user

/**
 * Theorem 2: Genesis Hash
 * Fixed 64-char hex value for the start of the tamper-evident log.
 */
export const GENESIS_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Theorem 8: Isolation Guardrails
 * Maximum aggregate no-contact targets allowed across all active contracts.
 */
export const ABSOLUTE_MAX_ISOLATION_TARGETS = 10;

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
 * Theorem 7: Shadow-Ban Threshold
 * Integrity score below which a Fury is excluded from job rotation.
 */
export const SHADOW_BAN_THRESHOLD = 20;

/**
 * Theorem 7: Default Consensus Size
 * Standard number of Furies assigned to each proof audit.
 */
export const FURY_CONSENSUS_SIZE = 3;

/**
 * ADR-004: Minimum agreeing votes required for a 3-Fury consensus verdict.
 */
export const FURY_CONSENSUS_AGREEMENT_REQUIRED = 2;

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
  PHOENIX_RECOVERY = "PHOENIX_RECOVERY", // Completed contract after a failure
  CONSISTENCY_KING = "CONSISTENCY_KING", // 30-day streak
  FURY_MASTER = "FURY_MASTER", // >200 audits with high accuracy
  EARLY_ADOPTER = "EARLY_ADOPTER", // Beta participant
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
  BIOLOGICAL: [
    VerificationMethod.HARDWARE_HEALTHKIT,
    VerificationMethod.HARDWARE_HEALTHCONNECT,
  ],
  COGNITIVE: [
    VerificationMethod.API_SCREEN_TIME,
    VerificationMethod.API_THIRD_PARTY,
  ],
  PROFESSIONAL: [
    VerificationMethod.API_THIRD_PARTY,
    VerificationMethod.FINANCIAL_LEDGER,
  ],
  CREATIVE: [VerificationMethod.TIME_LAPSE, VerificationMethod.FURY_CONSENSUS],
  VISUAL: [VerificationMethod.FURY_CONSENSUS, VerificationMethod.GPS_GEOFENCE],
  SOCIAL: [VerificationMethod.FURY_CONSENSUS, VerificationMethod.GPS_GEOFENCE],
  RECOVERY: [
    VerificationMethod.DAILY_ATTESTATION,
    VerificationMethod.API_SCREEN_TIME,
    VerificationMethod.FURY_CONSENSUS,
  ],
};

/**
 * Validates that an oath category uses a correct oracle/verification method.
 * Returns true if the mapping is valid, false if the method is not allowed for the stream.
 */
export function validateOathMapping(
  category: OathCategory,
  method: VerificationMethod,
): boolean {
  const categoryValue = category as string;
  // Extract the stream prefix (e.g., "BIOLOGICAL" from "BIOLOGICAL_WEIGHT")
  const stream = categoryValue.split("_")[0];
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
    return {
      success: false,
      reason: `Maximum ${MAX_GRACE_DAYS_PER_MONTH} grace days per month exceeded`,
    };
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
export function grantOnboardingBonus(
  totalContracts: number,
): OnboardingBonusResult {
  if (totalContracts > 0) {
    return {
      granted: false,
      amount: 0,
      reason: "User already has prior contracts",
    };
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
  "BIOLOGICAL",
  "COGNITIVE",
  "PROFESSIONAL",
  "CREATIVE",
  "VISUAL",
  "SOCIAL",
  "RECOVERY",
] as const;

/** Check if an oath category is supported in the current MVP */
export function isOathStreamActive(category: OathCategory): boolean {
  const stream = (category as string).split("_")[0];
  return (ACTIVE_OATH_STREAMS as readonly string[]).includes(stream);
}

/**
 * AEGIS-05: Pregnancy Exclusion Gate
 * Legal mandate: users who self-report pregnancy are excluded from penalty-bearing
 * contracts to comply with health-protection regulations. Penalty-free suspension
 * is available mid-contract. Attempted enrollment during pregnancy is blocked.
 */
export const PREGNANCY_EXCLUSION_ENABLED = true;

export const PREGNANCY_EXCLUDED_OATH_CATEGORIES = [
  OathCategory.WEIGHT_MANAGEMENT,
  OathCategory.CARDIOVASCULAR_STAMINA,
  OathCategory.NUTRITIONAL_TRANSPARENCY,
  OathCategory.SUBSTANCE_ABSTINENCE,
  OathCategory.BEHAVIORAL_DETOX,
];

export interface PregnancyExclusionResult {
  blocked: boolean;
  reason?: string;
}

export function checkPregnancyExclusion(
  isPregnant: boolean,
  oathCategory: OathCategory,
): PregnancyExclusionResult {
  if (!isPregnant) return { blocked: false };
  if (PREGNANCY_EXCLUDED_OATH_CATEGORIES.includes(oathCategory)) {
    return {
      blocked: true,
      reason: `Oath category ${oathCategory} is excluded during pregnancy for health safety`,
    };
  }
  return { blocked: false };
}

/**
 * AEGIS-06: Recovery Impulse Guardrails
 * Prevents users in active recovery from making impulsive decisions.
 */
export const RECOVERY_NEW_CONTRACT_COOLDOWN_HOURS = 72;
export const RECOVERY_FAILURE_LOCKOUT_HOURS = 24;
export const RECOVERY_MAX_ACTIVE_CONTRACTS = 2;
export const RECOVERY_MIN_INTERVAL_BETWEEN_CONTRACTS_HOURS = 168;

export interface RecoveryGuardrailResult {
  allowed: boolean;
  reason?: string;
}

export function validateRecoveryGuardrails(params: {
  activeRecoveryContractCount: number;
  hoursSinceLastRecoveryContract?: number;
  hoursSinceLastFailure?: number;
  isRecoveryOath: boolean;
}): RecoveryGuardrailResult {
  if (!params.isRecoveryOath) return { allowed: true };

  if (params.activeRecoveryContractCount >= RECOVERY_MAX_ACTIVE_CONTRACTS) {
    return {
      allowed: false,
      reason: `Maximum ${RECOVERY_MAX_ACTIVE_CONTRACTS} active recovery contracts allowed`,
    };
  }

  if (
    params.hoursSinceLastRecoveryContract !== undefined &&
    params.hoursSinceLastRecoveryContract <
      RECOVERY_MIN_INTERVAL_BETWEEN_CONTRACTS_HOURS
  ) {
    return {
      allowed: false,
      reason: `Must wait ${RECOVERY_MIN_INTERVAL_BETWEEN_CONTRACTS_HOURS}h between recovery contracts (${Math.round(params.hoursSinceLastRecoveryContract)}h elapsed)`,
    };
  }

  if (
    params.hoursSinceLastFailure !== undefined &&
    params.hoursSinceLastFailure < RECOVERY_FAILURE_LOCKOUT_HOURS
  ) {
    return {
      allowed: false,
      reason: `Recovery failure lockout: ${RECOVERY_FAILURE_LOCKOUT_HOURS}h cooldown required after failure`,
    };
  }

  return { allowed: true };
}

/**
 * GATEWAY-01: Gateway Oath Tier (Two-Minute Rule)
 * Zero/micro-stake tier for first-time users, re-entry, and overcommitters.
 * Progressive 5-phase Habit Shaping Ladder per category.
 */
export const GATEWAY_OATH_ENABLED = true;
export const GATEWAY_OATH_MIN_STAKE_CENTS = 100; // $1.00
export const GATEWAY_OATH_MAX_STAKE_CENTS = 200; // $2.00
export const GATEWAY_OATH_MIN_DURATION_DAYS = 3;
export const GATEWAY_OATH_MAX_DURATION_DAYS = 14;
export const GATEWAY_OATH_MAX_PER_USER = 3; // max gateway oaths per user lifetime
export const GATEWAY_OATH_PHASE_COUNT = 5;

export interface GatewayOathResult {
  allowed: boolean;
  reason?: string;
}

export function validateGatewayOath(params: {
  totalContracts: number;
  requestedStakeCents: number;
  requestedDurationDays: number;
}): GatewayOathResult {
  if (params.totalContracts > 0) {
    return { allowed: false, reason: "Gateway Oath available for first contract only" };
  }
  if (params.requestedStakeCents < GATEWAY_OATH_MIN_STAKE_CENTS) {
    return { allowed: false, reason: `Minimum gateway stake is $${(GATEWAY_OATH_MIN_STAKE_CENTS / 100).toFixed(2)}` };
  }
  if (params.requestedStakeCents > GATEWAY_OATH_MAX_STAKE_CENTS) {
    return { allowed: false, reason: `Maximum gateway stake is $${(GATEWAY_OATH_MAX_STAKE_CENTS / 100).toFixed(2)}` };
  }
  if (params.requestedDurationDays < GATEWAY_OATH_MIN_DURATION_DAYS) {
    return { allowed: false, reason: `Minimum gateway duration is ${GATEWAY_OATH_MIN_DURATION_DAYS} days` };
  }
  if (params.requestedDurationDays > GATEWAY_OATH_MAX_DURATION_DAYS) {
    return { allowed: false, reason: `Maximum gateway duration is ${GATEWAY_OATH_MAX_DURATION_DAYS} days` };
  }
  return { allowed: true };
}

/**
 * STAKE-01: Stake Tapering & Incentive Fading
 * Auto-reduces stakes as habits solidify to prevent overjustification effect.
 */
export const STAKE_TAPER_ENABLED = true;
export const STAKE_TAPER_PCT_PER_WEEK = 0.15; // 15% reduction per successful week
export const STAKE_TAPER_MIN_FLOOR_CENTS = 500; // $5.00 minimum floor
export const STAKE_TAPER_GRADUATION_THRESHOLD = 0.9; // P(H) > 0.9 for 2+ weeks

export interface StakeTaperResult {
  currentStakeCents: number;
  weekNumber: number;
  reductionCents: number;
  isAtFloor: boolean;
  isEligibleForGraduation: boolean;
}

export function calculateStakeTaper(
  initialStakeCents: number,
  completedWeeks: number,
): StakeTaperResult {
  let currentStake = initialStakeCents;
  let weekNum = 0;
  for (let w = 0; w < completedWeeks; w++) {
    const reduction = Math.round(currentStake * STAKE_TAPER_PCT_PER_WEEK);
    currentStake = Math.max(currentStake - reduction, STAKE_TAPER_MIN_FLOOR_CENTS);
    weekNum++;
  }
  return {
    currentStakeCents: currentStake,
    weekNumber: weekNum,
    reductionCents: initialStakeCents - currentStake,
    isAtFloor: currentStake <= STAKE_TAPER_MIN_FLOOR_CENTS,
    isEligibleForGraduation: completedWeeks >= 2 && false, // requires P(H) check by caller
  };
}

/**
 * CM-01: Contingency Management — Escalating Reward Schedule
 * Evidence-based positive reinforcement (NNT 3 for substance use disorders).
 */
export const CM_ENABLED = true;
export const CM_REWARD_TIERS: Array<{ startDay: number; endDay: number; rewardCents: number }> = [
  { startDay: 1, endDay: 7, rewardCents: 25 },    // $0.25/day
  { startDay: 8, endDay: 14, rewardCents: 50 },    // $0.50/day
  { startDay: 15, endDay: 21, rewardCents: 100 },   // $1.00/day
  { startDay: 22, endDay: 30, rewardCents: 150 },   // $1.50/day
];
export const CM_RESET_ON_MISSED_DAY_REWARD_CENTS = 25; // reset to $0.25/day

export function getCmRewardForDay(day: number): number {
  for (const tier of CM_REWARD_TIERS) {
    if (day >= tier.startDay && day <= tier.endDay) {
      return tier.rewardCents;
    }
  }
  return CM_REWARD_TIERS[CM_REWARD_TIERS.length - 1].rewardCents;
}

/**
 * MICRO-01: Per-Proof Micro-Reward System
 * Instant small rewards per verified proof, with variable-ratio bonuses.
 */
export const MICRO_REWARD_ENABLED = true;
export const MICRO_REWARD_BASE_CENTS = 25; // $0.25 per proof
export const MICRO_REWARD_RANGE_CENTS: [number, number] = [25, 100]; // $0.25–$1.00
export const MICRO_REWARD_BONUS_PROBABILITY = 0.2; // 20% chance of surprise bonus
export const MICRO_REWARD_BONUS_MULTIPLIER = 3; // 3x bonus on hit

export function calculateMicroReward(): { base: number; bonus: number; total: number } {
  const base = MICRO_REWARD_RANGE_CENTS[0] +
    Math.floor(Math.random() * (MICRO_REWARD_RANGE_CENTS[1] - MICRO_REWARD_RANGE_CENTS[0] + 1));
  const bonusHit = Math.random() < MICRO_REWARD_BONUS_PROBABILITY;
  const bonus = bonusHit ? base * MICRO_REWARD_BONUS_MULTIPLIER : 0;
  return { base, bonus, total: base + bonus };
}

/**
 * HABIT-01: Habit Strength Calculation
 * Based on repetition count (Lally et al. 2010), not elapsed time.
 * Follows asymptotic automaticity curve.
 */
export const HABIT_STRENGTH_AUTOMATICITY_THRESHOLD = 0.95;
export const HABIT_STRENGTH_AUTOMATICITY_MIDPOINT = 66; // repetitions to reach 0.5
export const HABIT_STRENGTH_CURVE_STEEPNESS = 0.07;

export function calculateHabitStrength(completedProofs: number, _totalRequired: number): number {
  // Logistic curve: 1 / (1 + e^(-k * (x - x0)))
  return 1 / (1 + Math.exp(-HABIT_STRENGTH_CURVE_STEEPNESS * (completedProofs - HABIT_STRENGTH_AUTOMATICITY_MIDPOINT)));
}

export function getHabitStrengthLabel(strength: number): string {
  if (strength >= 0.95) return 'Automatic';
  if (strength >= 0.8) return 'Strong';
  if (strength >= 0.5) return 'Developing';
  if (strength >= 0.2) return 'Early';
  return 'Fragile';
}

/**
 * BBO-01: Bigger Better Offer Substitution Engine
 * Active craving replacement with curated flow-producing activities.
 */
export interface BboEntry {
  id: string;
  category: string;
  title: string;
  description: string;
  durationMinutes: number;
  tags: string[];
}

export const BBO_LIBRARY: BboEntry[] = [
  { id: 'bbo-call-friend', category: 'social', title: 'Call a Friend', description: 'Phone a trusted friend for a 10-minute catch-up', durationMinutes: 10, tags: ['social', 'distraction'] },
  { id: 'bbo-walk', category: 'physical', title: 'Go for a Walk', description: 'Step outside for a 15-minute walk without your phone', durationMinutes: 15, tags: ['physical', 'nature'] },
  { id: 'bbo-meditate', category: 'mindfulness', title: '3-Minute Breath', description: 'Box breathing: 4-4-4-4 pattern for 3 minutes', durationMinutes: 3, tags: ['mindfulness', 'quick'] },
  { id: 'bbo-journal', category: 'reflection', title: 'Brain Dump', description: 'Write whatever comes to mind for 5 minutes', durationMinutes: 5, tags: ['reflection', 'writing'] },
  { id: 'bbo-exercise', category: 'physical', title: 'Quick Workout', description: '20 pushups, 20 squats, 30-second plank', durationMinutes: 5, tags: ['physical', 'endorphins'] },
  { id: 'bbo-music', category: 'creative', title: 'Play Music', description: 'Play one song you love on an instrument or speaker', durationMinutes: 4, tags: ['creative', 'mood'] },
  { id: 'bbo-read', category: 'focus', title: 'Read 5 Pages', description: 'Read 5 pages of any book you are currently reading', durationMinutes: 10, tags: ['focus', 'learning'] },
  { id: 'bbo-cold', category: 'physical', title: 'Cold Splash', description: 'Splash cold water on your face or take a cold shower', durationMinutes: 2, tags: ['physical', 'reset'] },
  { id: 'bbo-podcast', category: 'focus', title: 'Listen to a Podcast', description: 'Put on a 10-minute episode of a favorite podcast', durationMinutes: 10, tags: ['focus', 'distraction'] },
  { id: 'bbo-stretch', category: 'physical', title: 'Full Body Stretch', description: '5-minute full-body stretching routine', durationMinutes: 5, tags: ['physical', 'mindfulness'] },
];

export function getBboRecommendations(category: string, count = 3): BboEntry[] {
  const byCategory = BBO_LIBRARY.filter(b => b.category === category);
  const shuffled = [...(byCategory.length > 0 ? byCategory : BBO_LIBRARY)].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * FRICTION-01: Friction Audit Scoring
 * Measures environmental friction for habit success prediction.
 */
export const FRICTION_AUDIT_QUESTIONS = [
  { id: 'good_habit_steps', question: 'How many steps between you and your desired habit? (1 = immediate, 5 = many steps)', weight: 3 },
  { id: 'bad_habit_access', question: 'How easy is it to access the behavior you want to avoid? (1 = very hard, 5 = very easy)', weight: 3 },
  { id: 'environment_triggers', question: 'How many environmental triggers remind you of the old behavior? (1 = none, 5 = many)', weight: 2 },
  { id: 'social_support', question: 'Do people around you support this change? (1 = strongly, 5 = actively oppose)', weight: 2 },
  { id: 'time_availability', question: 'Do you have dedicated time for this habit? (1 = always, 5 = never)', weight: 1 },
];

export interface FrictionAuditResult {
  totalScore: number;
  maxScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export function calculateFrictionScore(answers: Record<string, number>): FrictionAuditResult {
  let totalScore = 0;
  let maxScore = 0;
  for (const q of FRICTION_AUDIT_QUESTIONS) {
    const answer = answers[q.id] ?? 3;
    totalScore += answer * q.weight;
    maxScore += 5 * q.weight;
  }
  const pct = totalScore / maxScore;
  const riskLevel = pct < 0.33 ? 'low' : pct < 0.66 ? 'medium' : 'high';
  const recommendations: string[] = [];
  if (answers.good_habit_steps && answers.good_habit_steps >= 3) {
    recommendations.push('Reduce steps to your habit: prepare equipment/tools the night before.');
  }
  if (answers.bad_habit_access && answers.bad_habit_access >= 3) {
    recommendations.push('Increase friction for the behavior you want to avoid: block apps, remove triggers.');
  }
  if (answers.environment_triggers && answers.environment_triggers >= 3) {
    recommendations.push('Remove environmental triggers: rearrange your space, change your route.');
  }
  if (answers.social_support && answers.social_support >= 3) {
    recommendations.push('Find social support: tell a friend about your commitment, join a pod.');
  }
  return { totalScore, maxScore, riskLevel, recommendations };
}

/**
 * TEMPTATION-01: Temptation Bundling (Premack's Principle)
 * Pairs need-behaviors with want-behaviors.
 */
export interface TemptationBundle {
  id: string;
  needBehavior: string;
  wantBehavior: string;
  category: string;
}

export function getTemptationBundles(category?: string): TemptationBundle[] {
  if (!category) return TEMPTATION_BUNDLE_TEMPLATES;
  return TEMPTATION_BUNDLE_TEMPLATES.filter(b => b.category === category);
}

export const TEMPTATION_BUNDLE_TEMPLATES: TemptationBundle[] = [
  { id: 'tb-exercise-netflix', needBehavior: 'exercise', wantBehavior: 'watch Netflix', category: 'BIOLOGICAL' },
  { id: 'tb-study-coffee', needBehavior: 'study', wantBehavior: 'drink specialty coffee', category: 'COGNITIVE' },
  { id: 'tb-work-music', needBehavior: 'deep work', wantBehavior: 'listen to music', category: 'PROFESSIONAL' },
  { id: 'tb-write-treat', needBehavior: 'write', wantBehavior: 'eat a treat', category: 'CREATIVE' },
  { id: 'tb-clean-podcast', needBehavior: 'clean', wantBehavior: 'listen to podcast', category: 'ENVIRONMENTAL' },
  { id: 'tb-meditate-walk', needBehavior: 'meditate', wantBehavior: 'go for a walk after', category: 'RECOVERY' },
];

/**
 * ABANDONMENT-01: Abandonment Typology Detection
 * Classifies user churn into 4 archetypes for targeted re-engagement.
 */
export enum AbandonmentType {
  FRUSTRATED = 'FRUSTRATED',
  BORED = 'BORED',
  HAPPY_GRADUATE = 'HAPPY_GRADUATE',
  LIFE_EVENT = 'LIFE_EVENT',
}

export interface AbandonmentClassification {
  type: AbandonmentType;
  confidence: number;
  signal: string;
}

export function classifyAbandonment(params: {
  completedContracts: number;
  failedContracts: number;
  averageCompletionRate: number;
  daysSinceLastActive: number;
  streakAtExit: number;
  integrityScore: number;
  supportTicketsOpened: number;
}): AbandonmentClassification {
  const { completedContracts, failedContracts, averageCompletionRate, daysSinceLastActive, streakAtExit, integrityScore, supportTicketsOpened } = params;
  const totalContracts = completedContracts + failedContracts;

  if (totalContracts > 0 && averageCompletionRate >= 0.9 && integrityScore >= 80 && daysSinceLastActive > 14) {
    return { type: AbandonmentType.HAPPY_GRADUATE, confidence: 0.8, signal: 'high completion rate + high integrity + inactive' };
  }
  if (failedContracts >= 2 && supportTicketsOpened >= 1 && daysSinceLastActive < 14) {
    return { type: AbandonmentType.FRUSTRATED, confidence: 0.75, signal: 'multiple failures + support tickets' };
  }
  if (completedContracts >= 3 && averageCompletionRate >= 0.8 && streakAtExit <= 3) {
    return { type: AbandonmentType.BORED, confidence: 0.7, signal: 'multiple completions + low exit streak' };
  }
  if (daysSinceLastActive > 30 && integrityScore > 50) {
    return { type: AbandonmentType.LIFE_EVENT, confidence: 0.6, signal: 'long absence + moderate integrity' };
  }
  return { type: AbandonmentType.FRUSTRATED, confidence: 0.5, signal: 'default classification' };
}

/**
 * REDEMPTION-01: Re-entry Path After Contract Failure
 */
export const REENTRY_COOLDOWN_DAYS = 7;
export const REENTRY_MAX_ATTEMPTS = 5;
export const REENTRY_STAKE_DISCOUNT_PCT = 0.5; // 50% of original stake
export const REENTRY_PHOENIX_BONUS_CENTS = 200; // $2.00 phoenix badge bonus

export interface ReentryEligibilityResult {
  eligible: boolean;
  attemptNumber: number;
  reducedStakeCents: number;
  reason?: string;
}

export function checkReentryEligibility(params: {
  daysSinceLastFailure: number;
  previousFailureCount: number;
  previousStakeCents: number;
}): ReentryEligibilityResult {
  if (params.daysSinceLastFailure < REENTRY_COOLDOWN_DAYS) {
    return {
      eligible: false,
      attemptNumber: params.previousFailureCount,
      reducedStakeCents: 0,
      reason: `Re-entry cooldown: ${REENTRY_COOLDOWN_DAYS - params.daysSinceLastFailure} days remaining`,
    };
  }
  if (params.previousFailureCount >= REENTRY_MAX_ATTEMPTS) {
    return {
      eligible: false,
      attemptNumber: params.previousFailureCount,
      reducedStakeCents: 0,
      reason: `Maximum re-entry attempts (${REENTRY_MAX_ATTEMPTS}) exceeded`,
    };
  }
  const reducedStake = Math.round(params.previousStakeCents * REENTRY_STAKE_DISCOUNT_PCT);
  return {
    eligible: true,
    attemptNumber: params.previousFailureCount + 1,
    reducedStakeCents: reducedStake,
  };
}

/**
 * DAY21-01: Day 21 Micro-Reward (Dopamine Danger Zone Intervention)
 */
export const DAY21_TRIGGER_DURATION_DAYS = 30; // Default contract duration that triggers day 21
export const DAY21_TARGET_DAY = 21;
export const DAY21_BONUS_INTEGRITY_POINTS = 5;
export const DAY21_VAULT_BONUS_CENTS = 150; // $1.50
export const DAY21_BADGE_NAME = 'DOPAMINE_DANGER_ZONE_SURVIVOR';

/**
 * EXIT-01: Post-Contract Exit Interview Questions
 */
export const EXIT_INTERVIEW_QUESTIONS_SUCCESS = [
  { id: 'satisfaction', question: 'How satisfied are you with your experience?', type: 'rating_1_5' },
  { id: 'difficulty', question: 'How difficult was this contract for you?', type: 'rating_1_5' },
  { id: 'what_helped', question: 'What helped you succeed?', type: 'text' },
  { id: 'improvement', question: 'What could we improve?', type: 'text' },
  { id: 'nps', question: 'How likely are you to recommend Styx to a friend?', type: 'rating_0_10' },
];

export const EXIT_INTERVIEW_QUESTIONS_FAILURE = [
  { id: 'satisfaction', question: 'How satisfied are you with how this was handled?', type: 'rating_1_5' },
  { id: 'why_failed', question: 'What caused the failure?', type: 'text' },
  { id: 'what_would_help', question: 'What would have helped you succeed?', type: 'text' },
  { id: 'return_intention', question: 'Would you try again?', type: 'rating_1_5' },
  { id: 'nps', question: 'How likely are you to recommend Styx to a friend?', type: 'rating_0_10' },
];

/**
 * RECOVERY-02: 90-Day Execution Matrix (Theorem 9)
 * Maps psychological vulnerability peaks to system state triggers.
 */
export enum RecoveryState {
  LOCKDOWN = "STATE_LOCKDOWN",
  WEEKEND_SHIELD = "STATE_WEEKEND_SHIELD",
  REWARD_INJECTION = "STATE_REWARD_INJECTION",
  FRICTION_DELAY = "STATE_FRICTION_DELAY",
  ALPHA_COMPLETE = "STATE_ALPHA_COMPLETE",
  NORMAL = "STATE_NORMAL",
}

export const RECOVERY_MATRIX = {
  [RecoveryState.LOCKDOWN]: {
    startDay: 0,
    endDay: 14,
    multiplier: 2.5,
    description: "Acute Withdrawal (Panic Phase)",
  },
  [RecoveryState.WEEKEND_SHIELD]: {
    multiplier: 2.0,
    description: "Structural Isolation (Weekend Void)",
  },
  [RecoveryState.REWARD_INJECTION]: {
    triggerDay: 21,
    refundPct: 0.05,
    description: "Dopamine Trough (Anhedonia Pivot)",
  },
  [RecoveryState.FRICTION_DELAY]: {
    startDay: 45,
    endDay: 60,
    multiplier: 1.5,
    delayHrs: 48,
    description: "Bargaining Stage",
  },
  [RecoveryState.ALPHA_COMPLETE]: {
    triggerDay: 90,
    feePct: 0,
    description: "Identity Reconstruction (Omega Milestone)",
  },
};

export function getRecoveryState(daysSinceContractStart: number, isWeekend: boolean): RecoveryState {
  if (daysSinceContractStart <= 14) return RecoveryState.LOCKDOWN;
  if (daysSinceContractStart <= 30 && isWeekend) return RecoveryState.WEEKEND_SHIELD;
  if (daysSinceContractStart === 21) return RecoveryState.REWARD_INJECTION;
  if (daysSinceContractStart >= 45 && daysSinceContractStart <= 60) return RecoveryState.FRICTION_DELAY;
  if (daysSinceContractStart >= 90) return RecoveryState.ALPHA_COMPLETE;
  return RecoveryState.NORMAL;
}

/**
 * #109: Disenchantment Score — Reward Devaluation Tracking
 * Measures how rewarding the old behavior feels over time (Brewer mechanism).
 */
export interface DisenchantmentEntry {
  date: string;
  rating: number;
}

export interface DisenchantmentResult {
  currentScore: number;
  startScore: number;
  trend: number;
  dropPct: number;
  milestone: 'NONE' | 'NOTICING' | 'REALIZATION' | 'TRANSFORMATION';
}

export function calculateDisenchantment(ratings: DisenchantmentEntry[]): DisenchantmentResult {
  if (ratings.length === 0) return { currentScore: 5, startScore: 5, trend: 0, dropPct: 0, milestone: 'NONE' };
  const sorted = [...ratings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const startScore = sorted[0].rating;
  const currentScore = sorted[sorted.length - 1].rating;
  const dropPct = startScore > 0 ? Math.round(((startScore - currentScore) / startScore) * 100) : 0;
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
  const firstAvg = firstHalf.reduce((s, e) => s + e.rating, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, e) => s + e.rating, 0) / secondHalf.length;
  const trend = Math.round((secondAvg - firstAvg) * 10) / 10;
  let milestone: DisenchantmentResult['milestone'] = 'NONE';
  if (dropPct >= 50) milestone = 'TRANSFORMATION';
  else if (dropPct >= 30) milestone = 'REALIZATION';
  else if (dropPct >= 15) milestone = 'NOTICING';
  return { currentScore, startScore, trend, dropPct, milestone };
}

/**
 * #110: Habit Discontinuity Window Detector
 * Life transitions create receptivity windows for new habit formation (Wood).
 */
export const DISCONTINUITY_WINDOW_DAYS = 30;

export enum LifeTransitionType {
  MOVE = 'MOVE',
  NEW_JOB = 'NEW_JOB',
  BREAKUP = 'BREAKUP',
  GRADUATION = 'GRADUATION',
  NEW_PARENT = 'NEW_PARENT',
  RETIREMENT = 'RETIREMENT',
  OTHER = 'OTHER',
}

export interface DiscontinuityWindow {
  active: boolean;
  transitionType: LifeTransitionType;
  daysRemaining: number;
  stakeDiscountPct: number;
  suggestedOaths: string[];
}

const DISCONTINUITY_OATH_MAP: Record<LifeTransitionType, string[]> = {
  [LifeTransitionType.MOVE]: ['BIOLOGICAL_CARDIO', 'ENVIRONMENTAL_TIDINESS', 'COGNITIVE_DIGITAL'],
  [LifeTransitionType.NEW_JOB]: ['PROFESSIONAL_TIME', 'COGNITIVE_FOCUS', 'BIOLOGICAL_SLEEP'],
  [LifeTransitionType.BREAKUP]: ['RECOVERY_NOCONTACT', 'BIOLOGICAL_SOBRIETY', 'CREATIVE_WRITING'],
  [LifeTransitionType.GRADUATION]: ['COGNITIVE_LEARNING', 'PROFESSIONAL_CODE', 'BIOLOGICAL_WEIGHT'],
  [LifeTransitionType.NEW_PARENT]: ['BIOLOGICAL_SLEEP', 'RECOVERY_NOCONTACT', 'ENVIRONMENTAL_TIDINESS'],
  [LifeTransitionType.RETIREMENT]: ['CREATIVE_WRITING', 'BIOLOGICAL_CARDIO', 'COGNITIVE_LEARNING'],
  [LifeTransitionType.OTHER]: ['BIOLOGICAL_WEIGHT', 'COGNITIVE_FOCUS', 'RECOVERY_NOCONTACT'],
};

export function detectDiscontinuityWindow(params: {
  transitionType: LifeTransitionType;
  daysSinceTransition: number;
}): DiscontinuityWindow {
  const active = params.daysSinceTransition <= DISCONTINUITY_WINDOW_DAYS;
  const remaining = Math.max(0, DISCONTINUITY_WINDOW_DAYS - params.daysSinceTransition);
  const discountPct = active ? Math.max(10, 50 - Math.floor(remaining / DISCONTINUITY_WINDOW_DAYS * 40)) : 0;
  return {
    active,
    transitionType: params.transitionType,
    daysRemaining: remaining,
    stakeDiscountPct: discountPct,
    suggestedOaths: DISCONTINUITY_OATH_MAP[params.transitionType] || DISCONTINUITY_OATH_MAP[LifeTransitionType.OTHER],
  };
}

/**
 * #111: Implementation Intention Contract Syntax
 * "I will [BEHAVIOR] at [TIME] in [LOCATION]" — Clear Ch.5.
 */
export const IMPLEMENTATION_INTENTION_TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;
export const IMPLEMENTATION_INTENTION_GRACE_MINUTES = 30;

export interface ImplementationIntention {
  behavior: string;
  time: string;
  location: string;
}

export interface ImplementationIntentionValidation {
  valid: boolean;
  errors: string[];
}

export function parseImplementationIntention(raw: string): ImplementationIntention | null {
  const match = raw.match(/^I will (.+) at (\d{2}:\d{2}) in (.+)$/i);
  if (!match) return null;
  return { behavior: match[1].trim(), time: match[2], location: match[3].trim() };
}

export function validateImplementationIntention(intention: ImplementationIntention): ImplementationIntentionValidation {
  const errors: string[] = [];
  if (!intention.behavior || intention.behavior.length < 2) errors.push('Behavior must be at least 2 characters');
  if (!IMPLEMENTATION_INTENTION_TIME_FORMAT.test(intention.time)) errors.push('Time must be in HH:MM 24-hour format');
  if (!intention.location || intention.location.length < 2) errors.push('Location must be at least 2 characters');
  return { valid: errors.length === 0, errors };
}

export function generateImplementationIntentionTemplate(category: OathCategory): string {
  const templates: Record<string, string> = {
    [OathCategory.CARDIOVASCULAR_STAMINA]: 'I will exercise at 07:00 in the living room',
    [OathCategory.DEEP_WORK_FOCUS]: 'I will do deep work at 09:00 in my home office',
    [OathCategory.SLEEP_INTEGRITY]: 'I will start my bedtime routine at 22:00 in my bedroom',
    [OathCategory.DIGITAL_FASTING]: 'I will put my phone away at 20:00 in the kitchen drawer',
    [OathCategory.SOBRIETY_HRV]: 'I will attend my meeting at 19:00 at the community center',
    [OathCategory.DEEP_WRITING]: 'I will write at 06:00 at my desk',
  };
  return templates[category] || 'I will [behavior] at [HH:MM] in [location]';
}

/**
 * #108: Passive Proof API Integrations
 * Strava, Duolingo, GitHub, Calm, Kindle — third-party activity as proof.
 */
export enum PassiveProvider {
  STRAVA = 'STRAVA',
  DUOLINGO = 'DUOLINGO',
  GITHUB = 'GITHUB',
  CALM = 'CALM',
  KINDLE = 'KINDLE',
}

export const PASSIVE_PROVIDER_CONFIG: Record<PassiveProvider, { label: string; proofType: string; refreshHrs: number }> = {
  [PassiveProvider.STRAVA]: { label: 'Strava', proofType: 'workout_completed', refreshHrs: 1 },
  [PassiveProvider.DUOLINGO]: { label: 'Duolingo', proofType: 'lesson_completed', refreshHrs: 1 },
  [PassiveProvider.GITHUB]: { label: 'GitHub', proofType: 'commit_pushed', refreshHrs: 6 },
  [PassiveProvider.CALM]: { label: 'Calm', proofType: 'meditation_completed', refreshHrs: 2 },
  [PassiveProvider.KINDLE]: { label: 'Kindle', proofType: 'reading_sessions', refreshHrs: 4 },
};

export function getPassiveProviders(): PassiveProvider[] {
  return Object.values(PassiveProvider);
}

export function getPassiveProviderConfig(provider: PassiveProvider) {
  return PASSIVE_PROVIDER_CONFIG[provider];
}

/**
 * #107: Emotional Contagion Safeguards for Pod Failure Broadcasting
 * Rate-limits and dampens pod-wide failure notifications to prevent cascading demotivation.
 */
export interface PodFailureBroadcast {
  podId: string;
  failureCount: number;
  memberCount: number;
  broadcastCooldownHrs: number;
  dampened: boolean;
}

export function evaluatePodBroadcast(params: {
  podId: string;
  failureCount: number;
  memberCount: number;
  lastBroadcastAt: Date | null;
}): PodFailureBroadcast {
  const cooldownHrs = Math.min(24, Math.max(1, Math.floor(params.failureCount / params.memberCount) * 4));
  const hrsSinceLastBroadcast = params.lastBroadcastAt
    ? (Date.now() - params.lastBroadcastAt.getTime()) / 3600000
    : Infinity;
  const dampened = hrsSinceLastBroadcast < cooldownHrs;
  return { podId: params.podId, failureCount: params.failureCount, memberCount: params.memberCount, broadcastCooldownHrs: cooldownHrs, dampened };
}

/**
 * #106: Fury Auditor Wellness System
 * Empathy fatigue prevention, bias detection, workload balancing.
 */
export interface AuditorWellnessState {
  auditorId: string;
  consecutiveReviews: number;
  fatigueScore: number;
  biasRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedBreak: boolean;
}

export function assessAuditorWellness(params: {
  auditorId: string;
  consecutiveReviews: number;
  avgReviewTimeSec: number;
  recentRejectionRate: number;
}): AuditorWellnessState {
  const consecutiveScore = Math.min(params.consecutiveReviews / 20, 1) * 40;
  const speedScore = params.avgReviewTimeSec < 10 ? 30 : 0;
  const rejectionScore = params.recentRejectionRate > 0.8 ? 30 : 0;
  const fatigueScore = Math.min(consecutiveScore + speedScore + rejectionScore, 100);
  let biasRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (fatigueScore > 70) biasRisk = 'HIGH';
  else if (fatigueScore > 40) biasRisk = 'MEDIUM';
  return { auditorId: params.auditorId, consecutiveReviews: params.consecutiveReviews, fatigueScore, biasRisk, recommendedBreak: fatigueScore > 60 };
}

/**
 * #105: Generosity Loop / Pay It Forward
 * Successful completers can sponsor a fraction of stake for a new user.
 */
export interface GenerosityGrant {
  giverId: string;
  receiverId: string;
  amountCents: number;
  badgeAwarded: boolean;
}

export function calculateGenerosityGrant(giverCompletedContracts: number, giverAverageStakeCents: number): { maxDonationCents: number; badgeThreshold: number } {
  const maxDonationCents = Math.round(giverAverageStakeCents * 0.2);
  const badgeThreshold = Math.max(1, Math.floor(giverCompletedContracts / 3));
  return { maxDonationCents, badgeThreshold };
}

/**
 * #104: Zero-Gap Contract Rollover
 * 'Start the Next One Today' momentum bridge when a contract completes.
 */
export interface RolloverOffer {
  eligible: boolean;
  previousCategory: string;
  suggestedNextCategory: string;
  continuityBonusCents: number;
  expiresInHrs: number;
}

export const ROLLOVER_EXPIRY_HRS = 24;
export const ROLLOVER_CONTINUITY_BONUS_CENTS = 50;

export function generateRolloverOffer(params: {
  completedContractCategory: string;
  completedContractStakeCents: number;
}): RolloverOffer {
  return {
    eligible: true,
    previousCategory: params.completedContractCategory,
    suggestedNextCategory: params.completedContractCategory,
    continuityBonusCents: ROLLOVER_CONTINUITY_BONUS_CENTS,
    expiresInHrs: ROLLOVER_EXPIRY_HRS,
  };
}

/**
 * #103: Styx Academy — Psychoeducation Module
 * Structured reward-based learning curriculum with progress tracking.
 */
export interface AcademyModule {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  rewardCents: number;
}

export const ACADEMY_CURRICULUM: AcademyModule[] = [
  { id: 'AM-01', title: 'How Habits Work', description: 'The cue-routine-reward loop and why willpower fails', durationMin: 10, rewardCents: 25 },
  { id: 'AM-02', title: 'Friction Engineering', description: 'Design your environment for automatic good choices', durationMin: 15, rewardCents: 35 },
  { id: 'AM-03', title: 'The Two-Minute Rule', description: 'Start so small you cannot say no', durationMin: 8, rewardCents: 25 },
  { id: 'AM-04', title: 'Identity-Based Habits', description: 'I am the person who... — rewrite your self-concept', durationMin: 12, rewardCents: 35 },
  { id: 'AM-05', title: 'Temptation Bundling', description: 'Link want behaviors with need behaviors', durationMin: 10, rewardCents: 25 },
  { id: 'AM-06', title: 'Implementation Intentions', description: 'I will [X] at [TIME] in [LOCATION]', durationMin: 10, rewardCents: 25 },
  { id: 'AM-07', title: 'The 4 Laws of Behavior Change', description: 'Make it obvious, attractive, easy, satisfying', durationMin: 20, rewardCents: 50 },
  { id: 'AM-08', title: 'Recovery & Disenchantment', description: 'Why the old habit loses its grip', durationMin: 15, rewardCents: 35 },
];

export function getAcademyProgress(completedIds: string[]): { completed: number; total: number; pct: number; unlockedRewards: number } {
  const total = ACADEMY_CURRICULUM.length;
  const completed = completedIds.filter(id => ACADEMY_CURRICULUM.some(m => m.id === id)).length;
  const unlockedRewards = ACADEMY_CURRICULUM.filter(m => completedIds.includes(m.id)).reduce((sum, m) => sum + m.rewardCents, 0);
  return { completed, total, pct: Math.round((completed / total) * 100), unlockedRewards };
}

/**
 * #100: Resistance Pattern Detection Engine
 * Identifies displacement, self-dramatization, victim narrative in attestation notes.
 */
export enum ResistancePattern {
  DISPLACEMENT = 'DISPLACEMENT',
  SELF_DRAMATIZATION = 'SELF_DRAMATIZATION',
  VICTIM_NARRATIVE = 'VICTIM_NARRATIVE',
  MINIMIZATION = 'MINIMIZATION',
  INTELLECTUALIZATION = 'INTELLECTUALIZATION',
}

export interface ResistanceSignal {
  pattern: ResistancePattern;
  confidence: number;
  snippet?: string;
}

const RESISTANCE_KEYWORDS: Record<ResistancePattern, RegExp[]> = {
  [ResistancePattern.DISPLACEMENT]: [/not my fault/i, /they made me/i, /because of/i, /would have if/i],
  [ResistancePattern.SELF_DRAMATIZATION]: [/always fail/i, /never work/i, /worst ever/i, /impossible/i],
  [ResistancePattern.VICTIM_NARRATIVE]: [/why me/i, /unfair/i, /no one understands/i, /against me/i],
  [ResistancePattern.MINIMIZATION]: [/it was just/i, /only once/i, /barely counts/i, /not that bad/i],
  [ResistancePattern.INTELLECTUALIZATION]: [/technically/i, /theoretically/i, /research says/i, /but actually/i],
};

export function detectResistancePatterns(text: string): ResistanceSignal[] {
  const signals: ResistanceSignal[] = [];
  for (const [pattern, regexps] of Object.entries(RESISTANCE_KEYWORDS)) {
    for (const re of regexps) {
      const match = text.match(re);
      if (match) {
        signals.push({ pattern: pattern as ResistancePattern, confidence: 0.6, snippet: match[0] });
        break;
      }
    }
  }
  return signals;
}

/**
 * #93: Multi-Instrument Personality & Motivation Assessment Battery
 * Intake assessment combining personality traits with motivation profiling.
 */
export interface AssessmentQuestion {
  id: string;
  question: string;
  scale: 'agree_1_5' | 'frequency_1_5' | 'importance_1_5';
  dimension: 'CONSCIENTIOUSNESS' | 'IMPULSIVITY' | 'MOTIVATION' | 'SELF_EFFICACY' | 'SOCIAL_SUPPORT';
}

export const INTAKE_ASSESSMENT: AssessmentQuestion[] = [
  { id: 'AS-01', question: 'I follow through on commitments even when I do not feel like it', scale: 'agree_1_5', dimension: 'CONSCIENTIOUSNESS' },
  { id: 'AS-02', question: 'I act on impulse without thinking about consequences', scale: 'agree_1_5', dimension: 'IMPULSIVITY' },
  { id: 'AS-03', question: 'I am confident I can change my habits', scale: 'agree_1_5', dimension: 'SELF_EFFICACY' },
  { id: 'AS-04', question: 'How often do you feel motivated to work on your goals?', scale: 'frequency_1_5', dimension: 'MOTIVATION' },
  { id: 'AS-05', question: 'I have people in my life who support my growth', scale: 'agree_1_5', dimension: 'SOCIAL_SUPPORT' },
  { id: 'AS-06', question: 'I complete tasks I start', scale: 'agree_1_5', dimension: 'CONSCIENTIOUSNESS' },
  { id: 'AS-07', question: 'How important is personal growth to you right now?', scale: 'importance_1_5', dimension: 'MOTIVATION' },
  { id: 'AS-08', question: 'I can resist temptation when I set my mind to it', scale: 'agree_1_5', dimension: 'IMPULSIVITY' },
];

export interface AssessmentProfile {
  conscientiousness: number;
  impulsivity: number;
  motivation: number;
  selfEfficacy: number;
  socialSupport: number;
  archetype: 'ACHIEVER' | 'STRUGGLER' | 'SOCIAL_DEPENDENT' | 'IMPULSIVE' | 'BALANCED';
}

export function calculateAssessmentProfile(answers: Record<string, number>): AssessmentProfile {
  const dims: Record<string, number[]> = { CONSCIENTIOUSNESS: [], IMPULSIVITY: [], MOTIVATION: [], SELF_EFFICACY: [], SOCIAL_SUPPORT: [] };
  for (const q of INTAKE_ASSESSMENT) {
    const val = answers[q.id];
    if (val != null) dims[q.dimension].push(val);
  }
  const avg = (vals: number[]) => (vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 3);
  const conscientiousness = avg(dims.CONSCIENTIOUSNESS);
  const impulsivity = avg(dims.IMPULSIVITY);
  const motivation = avg(dims.MOTIVATION);
  const selfEfficacy = avg(dims.SELF_EFFICACY);
  const socialSupport = avg(dims.SOCIAL_SUPPORT);
  let archetype: AssessmentProfile['archetype'] = 'BALANCED';
  if (conscientiousness >= 4 && selfEfficacy >= 4) archetype = 'ACHIEVER';
  else if (impulsivity >= 4 && conscientiousness < 3) archetype = 'IMPULSIVE';
  else if (socialSupport < 2.5) archetype = 'SOCIAL_DEPENDENT';
  else if (selfEfficacy < 2.5 && motivation < 3) archetype = 'STRUGGLER';
  return { conscientiousness, impulsivity, motivation, selfEfficacy, socialSupport, archetype };
}

/**
 * #92: DECO Privacy-Preserving Oracle Stub
 * TLS-based verification without exposing raw data (conceptual model).
 */
export interface DecoProofRequest {
  url: string;
  selector: string;
  expectedValue: string;
}

export interface DecoProofResult {
  verified: boolean;
  revealedFields: string[];
  timestamp: string;
  commitmentHash: string;
}

export async function createDecoProof(params: DecoProofRequest): Promise<DecoProofResult> {
  const timestamp = new Date().toISOString();
  const payload = params.url + params.selector + params.expectedValue + timestamp;
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  const commitmentHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  return { verified: true, revealedFields: [params.selector], timestamp, commitmentHash };
}

/**
 * #91: Oracle Failure Fallback — Staked Arbiter Network
 * When automated verification fails, fall back to human arbiters with skin in the game.
 */
export interface ArbiterVerdict {
  arbiterId: string;
  contractId: string;
  verdict: 'UPHELD' | 'OVERTURNED' | 'ESCALATED';
  stakeAtRiskCents: number;
}

export function resolveOracleFailure(arbiterVerdicts: ArbiterVerdict[]): ArbiterVerdict {
  const upheld = arbiterVerdicts.filter(v => v.verdict === 'UPHELD').length;
  const overturned = arbiterVerdicts.filter(v => v.verdict === 'OVERTURNED').length;
  const majority: 'UPHELD' | 'OVERTURNED' = upheld >= overturned ? 'UPHELD' : 'OVERTURNED';
  return { arbiterId: 'consensus', contractId: arbiterVerdicts[0]?.contractId ?? '', verdict: majority, stakeAtRiskCents: Math.max(...arbiterVerdicts.map(v => v.stakeAtRiskCents)) };
}

/**
 * #90: Stablecoin-Denominated Stakes (Conceptual)
 * Crypto payment rail for regulatory flexibility.
 */
export interface StablecoinQuote {
  usdCents: number;
  stablecoinAmount: string;
  stablecoinType: 'USDC' | 'USDT';
  exchangeRate: number;
}

export function quoteStablecoinStake(usdCents: number, stablecoinType: 'USDC' | 'USDT'): StablecoinQuote {
  const rate = stablecoinType === 'USDC' ? 1.001 : 1.002;
  return { usdCents, stablecoinAmount: ((usdCents / 100) * rate).toFixed(6), stablecoinType, exchangeRate: rate };
}

/**
 * #89: Data Revenue Sharing — User Behavioral Data Ownership
 * Users earn from aggregated, anonymized behavioral data sales.
 */
export interface RevenueShareRecord {
  userId: string;
  period: string;
  totalPoolCents: number;
  userShareCents: number;
  dataPoints: number;
}

export function calculateRevenueShare(params: {
  totalPoolCents: number;
  totalDataPoints: number;
  userDataPoints: number;
}): { userShareCents: number; sharePct: number } {
  if (params.totalDataPoints === 0) return { userShareCents: 0, sharePct: 0 };
  const sharePct = params.userDataPoints / params.totalDataPoints;
  return { userShareCents: Math.round(params.totalPoolCents * sharePct), sharePct: Math.round(sharePct * 10000) / 100 };
}

/**
 * #88: Asymmetric Whistleblower System
 * Enhanced anonymous reporting with graduated rewards and protection.
 */
export interface WhistleblowerReport {
  reportId: string;
  targetUserId: string;
  category: 'FRAUD' | 'ABUSE' | 'COLLUSION' | 'OTHER';
  evidenceHash: string;
  rewardCents: number;
  anonymityLevel: 'FULL' | 'CONDITIONAL';
}

export const WHISTLEBLOWER_BASE_REWARD = 500;
export const WHISTLEBLOWER_MULTIPLIER = { FRAUD: 3, ABUSE: 2, COLLUSION: 1.5, OTHER: 1 };

export function createWhistleblowerReport(category: WhistleblowerReport['category']): { rewardCents: number; anonymityLevel: WhistleblowerReport['anonymityLevel']; escalationPath: string } {
  const rewardCents = Math.round(WHISTLEBLOWER_BASE_REWARD * (WHISTLEBLOWER_MULTIPLIER[category] ?? 1));
  return { rewardCents, anonymityLevel: 'FULL', escalationPath: `${category.toLowerCase()}-review-panel` };
}
