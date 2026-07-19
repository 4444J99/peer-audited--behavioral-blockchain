/**
 * Behavioral Enhancements: Advanced behavioral physics modules.
 *
 * Implements seven enhancement features that extend the core behavioral contract engine:
 *   1. Crab Bucket Alert — social environment sabotage detection
 *   2. Commitment Device Marketplace — one-time setup actions
 *   3. Identity-Based Reframing Engine — domain-tuned notification language
 *   4. Save More Tomorrow — upward stake escalation
 *   5. Professional Mode UX — self-distancing & detachment
 *   6. Habituation Detector — creative disruption for long-running contracts
 *   7. Behavior Swap Contracts — substitution-based oaths
 */

import { OathCategory } from "./behavioral-logic";

// ─── 1. Crab Bucket Alert ────────────────────────────────────────────────

export enum CrabBucketSeverity {
  NONE = "NONE",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export interface CrabBucketSignal {
  userId: string;
  severity: CrabBucketSeverity;
  signalCount: number;
  patterns: CrabBucketPattern[];
  triggeredAt: Date;
}

export enum CrabBucketPattern {
  SABOTAGE_OFFER = "SABOTAGE_OFFER",
  NEGATIVE_PEER_INFLUENCE = "NEGATIVE_PEER_INFLUENCE",
  ENABLING_BEHAVIOR = "ENABLING_BEHAVIOR",
  MINIMIZATION_OF_PROGRESS = "MINIMIZATION_OF_PROGRESS",
  DIRECT_TEMPTATION = "DIRECT_TEMPTATION",
}

export const CRAB_BUCKET_SEVERITY_THRESHOLDS = {
  LOW: 1,
  MEDIUM: 3,
  HIGH: 5,
} as const;

export function classifyCrabBucketRisk(
  signalCount: number,
): CrabBucketSeverity {
  if (signalCount >= CRAB_BUCKET_SEVERITY_THRESHOLDS.HIGH)
    return CrabBucketSeverity.HIGH;
  if (signalCount >= CRAB_BUCKET_SEVERITY_THRESHOLDS.MEDIUM)
    return CrabBucketSeverity.MEDIUM;
  if (signalCount >= CRAB_BUCKET_SEVERITY_THRESHOLDS.LOW)
    return CrabBucketSeverity.LOW;
  return CrabBucketSeverity.NONE;
}

// ─── 2. Commitment Device Marketplace ──────────────────────────────────

export interface CommitmentDevice {
  id: string;
  name: string;
  description: string;
  category: CommitmentDeviceCategory;
  oneTimeCost: number;
  stakeAmplifier: number;
  activeSubscribers: number;
  successRate: number;
}

export enum CommitmentDeviceCategory {
  FINANCIAL_BARRIER = "FINANCIAL_BARRIER",
  SOCIAL_CONTRACT = "SOCIAL_CONTRACT",
  PHYSICAL_CONSTRAINT = "PHYSICAL_CONSTRAINT",
  DIGITAL_RESTRICTION = "DIGITAL_RESTRICTION",
  ENVIRONMENTAL_REDESIGN = "ENVIRONMENTAL_REDESIGN",
}

export const DEFAULT_COMMITMENT_DEVICE_CATALOG: Omit<
  CommitmentDevice,
  "activeSubscribers"
>[] = [
  {
    id: "cd-001",
    name: "Irreversible Donation Pledge",
    description: "Pre-committed donation to an opposing cause on failure",
    category: CommitmentDeviceCategory.FINANCIAL_BARRIER,
    oneTimeCost: 0,
    stakeAmplifier: 2.5,
    successRate: 0.72,
  },
  {
    id: "cd-002",
    name: "Public Accountability Post",
    description: "Auto-scheduled social media post announcing commitment",
    category: CommitmentDeviceCategory.SOCIAL_CONTRACT,
    oneTimeCost: 0,
    stakeAmplifier: 1.5,
    successRate: 0.64,
  },
  {
    id: "cd-003",
    name: "App Blocker Installation",
    description: "Pre-installed focus-mode blocker activated on failure",
    category: CommitmentDeviceCategory.DIGITAL_RESTRICTION,
    oneTimeCost: 0,
    stakeAmplifier: 1.8,
    successRate: 0.68,
  },
  {
    id: "cd-004",
    name: "Gym Key Lockbox",
    description:
      "Time-locked gym access card released only on streak completion",
    category: CommitmentDeviceCategory.PHYSICAL_CONSTRAINT,
    oneTimeCost: 499,
    stakeAmplifier: 1.3,
    successRate: 0.75,
  },
];

export function calculateStakeWithDevice(
  baseStake: number,
  devices: CommitmentDevice[],
): number {
  const totalAmplifier = devices.reduce((sum, d) => sum + d.stakeAmplifier, 0);
  return Math.round(baseStake * Math.min(totalAmplifier, 10) * 100) / 100;
}

// ─── 3. Identity-Based Reframing Engine ────────────────────────────────

export enum IdentityDomain {
  ATHLETE = "ATHLETE",
  SCHOLAR = "SCHOLAR",
  MAKER = "MAKER",
  PARENT = "PARENT",
  PROFESSIONAL = "PROFESSIONAL",
  RECOVERY = "RECOVERY",
  DEFAULT = "DEFAULT",
}

export interface ReframingTemplate {
  domain: IdentityDomain;
  failureMessage: string;
  streakMilestoneMessage: string;
  dailyCheckInMessage: string;
  graceDayMessage: string;
}

export const IDENTITY_REFRAMING_TABLE: Record<
  IdentityDomain,
  ReframingTemplate
> = {
  [IdentityDomain.ATHLETE]: {
    domain: IdentityDomain.ATHLETE,
    failureMessage:
      "Every champion has off days. This data point refines your training protocol.",
    streakMilestoneMessage:
      "{streak}-day streak: your discipline compound is yielding asymmetric returns.",
    dailyCheckInMessage:
      "Training log: session {streak}. What did you execute today?",
    graceDayMessage: "Active recovery day. Return sharper tomorrow.",
  },
  [IdentityDomain.SCHOLAR]: {
    domain: IdentityDomain.SCHOLAR,
    failureMessage:
      "Even the best experiments produce null results. This is a data point, not a verdict.",
    streakMilestoneMessage:
      "{streak}-day study streak: your knowledge graph is expanding exponentially.",
    dailyCheckInMessage:
      "Study session {streak}. What concept did you master today?",
    graceDayMessage:
      "Rest day for consolidation. Spaced repetition works best with breaks.",
  },
  [IdentityDomain.MAKER]: {
    domain: IdentityDomain.MAKER,
    failureMessage:
      "Not every build ships. This iteration revealed a constraint — that is progress.",
    streakMilestoneMessage:
      "{streak} consecutive build days. Your shipping muscle is getting stronger.",
    dailyCheckInMessage:
      "Build {streak}. What did you ship today — even if it was a single line?",
    graceDayMessage: "Design thinking day. Step back to see the architecture.",
  },
  [IdentityDomain.PARENT]: {
    domain: IdentityDomain.PARENT,
    failureMessage:
      "Parenting is the ultimate long game. One misstep doesn't define your arc.",
    streakMilestoneMessage:
      "{streak} days of intentional parenting. Your kids are internalizing consistency.",
    dailyCheckInMessage:
      "Day {streak}. What intentional moment did you create with your family today?",
    graceDayMessage:
      "Grace day: modeling self-compassion is a parenting lesson too.",
  },
  [IdentityDomain.PROFESSIONAL]: {
    domain: IdentityDomain.PROFESSIONAL,
    failureMessage:
      "Professional growth is measured in quarters, not days. This is a variance point.",
    streakMilestoneMessage:
      "{streak}-day professional streak. Your execution velocity is compounding.",
    dailyCheckInMessage:
      "Work log {streak}. What was your highest-leverage action today?",
    graceDayMessage:
      "Strategic pause. The best decisions come from white space.",
  },
  [IdentityDomain.RECOVERY]: {
    domain: IdentityDomain.RECOVERY,
    failureMessage:
      "Lapses are part of the recovery arc. You are not starting over — you are continuing with new data.",
    streakMilestoneMessage:
      "{streak} days. Your neurochemistry is literally rewiring. This is biological.",
    dailyCheckInMessage:
      "Day {streak}. Recovery is not deprivation — it is liberation. How are you feeling?",
    graceDayMessage:
      "RAIN check: Recognize the urge, Allow it, Investigate with kindness, Note what passes.",
  },
  [IdentityDomain.DEFAULT]: {
    domain: IdentityDomain.DEFAULT,
    failureMessage: "Psychological reframing of failure as a pivot point.",
    streakMilestoneMessage: "{streak}-day streak: consistency compounding.",
    dailyCheckInMessage: "Day {streak}. What progress did you make?",
    graceDayMessage: "Rest day. Come back stronger.",
  },
};

export function getIdentityDomainFromOath(
  category: OathCategory,
): IdentityDomain {
  const prefix = category.split("_")[0];
  switch (prefix) {
    case "BIOLOGICAL":
      return IdentityDomain.ATHLETE;
    case "COGNITIVE":
      return IdentityDomain.SCHOLAR;
    case "PROFESSIONAL":
      return IdentityDomain.PROFESSIONAL;
    case "CREATIVE":
      return IdentityDomain.MAKER;
    case "RECOVERY":
      return IdentityDomain.RECOVERY;
    default:
      return IdentityDomain.DEFAULT;
  }
}

export function reframeMessage(
  template: ReframingTemplate,
  type: "failure" | "streak" | "daily" | "grace",
  streak: number,
): string {
  const message = template[
    {
      failure: "failureMessage",
      streak: "streakMilestoneMessage",
      daily: "dailyCheckInMessage",
      grace: "graceDayMessage",
    }[type] as keyof ReframingTemplate
  ] as string;
  return message.replace("{streak}", String(streak));
}

// ─── 4. Save More Tomorrow ────────────────────────────────────────────

export const SAVE_MORE_TOMORROW_MIN_INCREMENT = 5;
export const SAVE_MORE_TOMORROW_MAX_INCREMENT = 200;
export const SAVE_MORE_TOMORROW_MAX_CUMULATIVE_MULTIPLIER = 5;

export interface EscalationSchedule {
  enabled: boolean;
  incrementAmount: number;
  incrementIntervalDays: number;
  maxStake: number;
  currentMultiplier: number;
  nextEscalationDate: Date;
}

export function createDefaultEscalationSchedule(
  baseStake: number,
): EscalationSchedule {
  return {
    enabled: false,
    incrementAmount: Math.min(
      Math.round(baseStake * 0.1 * 100) / 100,
      SAVE_MORE_TOMORROW_MAX_INCREMENT,
    ),
    incrementIntervalDays: 7,
    maxStake: baseStake * SAVE_MORE_TOMORROW_MAX_CUMULATIVE_MULTIPLIER,
    currentMultiplier: 1,
    nextEscalationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}

export function calculateNextStake(
  schedule: EscalationSchedule,
  currentStake: number,
): number {
  if (!schedule.enabled) return currentStake;
  const next = currentStake + schedule.incrementAmount;
  return Math.min(next, schedule.maxStake);
}

// ─── 5. Professional Mode UX ──────────────────────────────────────────

export enum ProfessionalModeLevel {
  STANDARD = "STANDARD",
  DETACHED = "DETACHED",
  ANALYTICAL = "ANALYTICAL",
}

export interface ProfessionalModeConfig {
  level: ProfessionalModeLevel;
  selfDistancingEnabled: boolean;
  thirdPersonNarration: boolean;
  emotionalTone: "clinical" | "direct" | "data_driven";
  hideStreakCounters: boolean;
  showAnalyticsDashboard: boolean;
}

export const PROFESSIONAL_MODE_DEFAULTS: ProfessionalModeConfig = {
  level: ProfessionalModeLevel.STANDARD,
  selfDistancingEnabled: false,
  thirdPersonNarration: false,
  emotionalTone: "direct",
  hideStreakCounters: false,
  showAnalyticsDashboard: false,
};

export function applyProfessionalModeCopy(
  text: string,
  config: ProfessionalModeConfig,
): string {
  if (!config.selfDistancingEnabled) return text;
  return text
    .replace(/\byou\b/gi, "the participant")
    .replace(/\byour\b/gi, "the participant's")
    .replace(/\byou're\b/gi, "the participant is");
}

// ─── 6. Habituation Detector ──────────────────────────────────────────

export const HABITUATION_MIN_DAYS = 14;
export const HABITUATION_DECAY_THRESHOLD = 0.7;

export enum HabituationStatus {
  NORMAL = "NORMAL",
  EARLY_DECAY = "EARLY_DECAY",
  PLATEAU = "PLATEAU",
  HABITUATED = "HABITUATED",
}

export interface HabituationMetrics {
  contractAgeDays: number;
  weeklyAttestationRate: number[];
  streakVariance: number;
  timeOfDayVariance: number;
  status: HabituationStatus;
  suggestedDisruption: string | null;
}

export function detectHabituation(
  contractAgeDays: number,
  recentAttestationRates: number[],
  streakVariance: number,
): HabituationMetrics {
  const avgRate =
    recentAttestationRates.reduce((a, b) => a + b, 0) /
    recentAttestationRates.length;
  let status = HabituationStatus.NORMAL;
  let suggestedDisruption: string | null = null;

  if (contractAgeDays < HABITUATION_MIN_DAYS) {
    return {
      contractAgeDays,
      weeklyAttestationRate: recentAttestationRates,
      streakVariance,
      timeOfDayVariance: 0,
      status,
      suggestedDisruption,
    };
  }

  if (avgRate < 0.6) {
    status = HabituationStatus.EARLY_DECAY;
    suggestedDisruption =
      'Introduce a 48-hour "surprise challenge" with doubled stakes for one day.';
  } else if (streakVariance < 0.05 && avgRate > 0.9 && contractAgeDays > 30) {
    status = HabituationStatus.HABITUATED;
    suggestedDisruption =
      "Strong habit formed. Consider a behavior swap contract for a related domain.";
  } else if (streakVariance < 0.1 && avgRate > 0.85) {
    status = HabituationStatus.PLATEAU;
    suggestedDisruption =
      'Rotate verification method or introduce a "novelty multiplier" bonus day.';
  }

  return {
    contractAgeDays,
    weeklyAttestationRate: recentAttestationRates,
    streakVariance,
    timeOfDayVariance: 0,
    status,
    suggestedDisruption,
  };
}

// ─── 7. Behavior Swap Contracts ───────────────────────────────────────

export interface BehaviorSwapContract {
  id: string;
  sourceContractId: string;
  targetOathCategory: OathCategory;
  swapReason: string;
  carryOverStakePct: number;
  status: BehaviorSwapStatus;
  createdAt: Date;
}

export enum BehaviorSwapStatus {
  PROPOSED = "PROPOSED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  ACTIVE = "ACTIVE",
}

export const BEHAVIOR_SWAP_MIN_CARRY_OVER_PCT = 10;
export const BEHAVIOR_SWAP_MAX_CARRY_OVER_PCT = 100;
export const BEHAVIOR_SWAP_COOLDOWN_DAYS = 14;

export function validateSwapEligibility(
  sourceContractDays: number,
  sourceContractStatus: string,
  priorSwapCount: number,
): { eligible: boolean; reason?: string } {
  if (sourceContractStatus !== "ACTIVE") {
    return { eligible: false, reason: "Source contract must be active" };
  }
  if (sourceContractDays < BEHAVIOR_SWAP_COOLDOWN_DAYS) {
    return {
      eligible: false,
      reason: `Must wait ${BEHAVIOR_SWAP_COOLDOWN_DAYS} days from contract start`,
    };
  }
  if (priorSwapCount >= 2) {
    return {
      eligible: false,
      reason: "Maximum of 2 behavior swaps per contract",
    };
  }
  return { eligible: true };
}

export function calculateSwapStake(
  sourceStake: number,
  carryOverPct: number,
): number {
  const pct = Math.max(
    BEHAVIOR_SWAP_MIN_CARRY_OVER_PCT,
    Math.min(carryOverPct, BEHAVIOR_SWAP_MAX_CARRY_OVER_PCT),
  );
  return Math.round(sourceStake * (pct / 100) * 100) / 100;
}
