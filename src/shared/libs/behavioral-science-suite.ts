/**
 * Behavioral Science Suite: High-leverage behavioral physics algorithms.
 *
 * Implements core psychological mechanics anchored in foundational literature:
 *   1. Implementation Intentions Engine (Issue #111 - James Clear §Ch. 5, British exercise study)
 *   2. Habit Discontinuity Window Detector (Issue #110 - Wendy Wood §Ch. 11, Bas Verplanken)
 *   3. Disenchantment Score Tracker (Issue #109 - Judson Brewer §Ch. 1, 5, 7, 10, Craving to Quit)
 *   4. Bigger Better Offer (BBO) Substitution Engine (Issue #102 - Judson Brewer)
 *   5. Gateway Oath Tier — Two-Minute Rule Ladder (Issue #99 - James Clear §Ch. 13)
 *   6. Temptation Bundling Engine (Issue #97 - Premack's Principle, Katy Milkman)
 */

// ─── 1. Implementation Intentions Engine (#111) ──────────────────────────

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  name: string;
}

export interface ImplementationIntention {
  behavior: string;
  declaredTime: string; // "HH:MM" 24-hr format e.g. "07:30"
  toleranceMinutes: number; // default ±30 min
  location?: LocationCoordinate;
}

/**
 * Parses natural implementation intention statements matching:
 * "I will [BEHAVIOR] at [TIME] in [LOCATION]" or "I will [BEHAVIOR] at [TIME]"
 */
export function parseImplementationIntention(
  statement: string,
): ImplementationIntention | null {
  if (!statement || typeof statement !== "string") return null;

  const normalized = statement.trim();
  const pattern =
    /^I will\s+(.+?)\s+at\s+(\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)(?:\s+(?:in|at)\s+(.+))?$/i;
  const match = normalized.match(pattern);
  if (!match) return null;

  const behavior = match[1].trim();
  const timeStr = match[2].trim();
  const locationName = match[3]?.trim();

  // Normalize to 24-hr HH:MM
  const time24 = normalizeTo24HourTime(timeStr);
  if (!time24) return null;

  const result: ImplementationIntention = {
    behavior,
    declaredTime: time24,
    toleranceMinutes: 30,
  };

  if (locationName) {
    result.location = {
      name: locationName,
      latitude: 0,
      longitude: 0,
      radiusMeters: 200, // 200m standard geofence
    };
  }

  return result;
}

function normalizeTo24HourTime(timeStr: string): string | null {
  const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
  if (!ampmMatch) return null;

  let hours = parseInt(ampmMatch[1], 10);
  const minutes = parseInt(ampmMatch[2], 10);
  const modifier = ampmMatch[3]?.toUpperCase();

  if (minutes < 0 || minutes > 59) return null;

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  if (hours < 0 || hours > 23) return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Validates whether a proof submission timestamp falls within the declared time window (± tolerance).
 */
export function verifyProofTimestampAgainstIntention(
  proofDate: Date,
  declaredTime: string,
  toleranceMinutes = 30,
): { valid: boolean; deltaMinutes: number } {
  const [targetH, targetM] = declaredTime.split(":").map((v) => parseInt(v, 10));
  const proofH = proofDate.getHours();
  const proofM = proofDate.getMinutes();

  const proofTotalMinutes = proofH * 60 + proofM;
  const targetTotalMinutes = targetH * 60 + targetM;

  let delta = Math.abs(proofTotalMinutes - targetTotalMinutes);
  // Handle midnight wrap-around (e.g. 23:55 vs 00:05)
  if (delta > 720) {
    delta = 1440 - delta;
  }

  return {
    valid: delta <= toleranceMinutes,
    deltaMinutes: delta,
  };
}

/**
 * Calculates surface distance between two GPS coordinates using Haversine formula.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Verifies if proof GPS coordinates fall inside the intention's geofence boundary.
 */
export function verifyProofLocationAgainstIntention(
  proofCoords: { latitude: number; longitude: number },
  location: LocationCoordinate,
): { valid: boolean; distanceMeters: number } {
  const distance = calculateHaversineDistanceMeters(
    proofCoords.latitude,
    proofCoords.longitude,
    location.latitude,
    location.longitude,
  );
  return {
    valid: distance <= location.radiusMeters,
    distanceMeters: distance,
  };
}

// ─── 2. Habit Discontinuity Window Detector (#110) ───────────────────────

export const DISCONTINUITY_WINDOW_DAYS = 30;

export enum DiscontinuityTrigger {
  RELOCATION = "RELOCATION",
  CAREER_TRANSITION = "CAREER_TRANSITION",
  SCHEDULE_SHIFT = "SCHEDULE_SHIFT",
  ACADEMIC_CYCLE = "ACADEMIC_CYCLE",
  RELATIONSHIP_CHANGE = "RELATIONSHIP_CHANGE",
  RECOVERY_RESTART = "RECOVERY_RESTART",
}

export interface DiscontinuityWindow {
  trigger: DiscontinuityTrigger;
  startedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  daysRemaining: number;
  receptivityMultiplier: number;
  promotionalGraceDays: number;
  recommendationMessage: string;
}

export function detectDiscontinuityWindow(
  trigger: DiscontinuityTrigger,
  transitionDate: Date,
  now: Date = new Date(),
): DiscontinuityWindow {
  const startedAt = new Date(transitionDate);
  const expiresAt = new Date(startedAt.getTime() + DISCONTINUITY_WINDOW_DAYS * 86400000);
  const msRemaining = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / 86400000));
  const isActive = now >= startedAt && daysRemaining > 0;

  // Wendy Wood: Major spatial disruption yields highest cue disruption (2.0x)
  const multipliers: Record<DiscontinuityTrigger, number> = {
    [DiscontinuityTrigger.RELOCATION]: 2.2,
    [DiscontinuityTrigger.CAREER_TRANSITION]: 1.8,
    [DiscontinuityTrigger.SCHEDULE_SHIFT]: 1.5,
    [DiscontinuityTrigger.ACADEMIC_CYCLE]: 1.6,
    [DiscontinuityTrigger.RELATIONSHIP_CHANGE]: 1.7,
    [DiscontinuityTrigger.RECOVERY_RESTART]: 2.0,
  };

  const receptivityMultiplier = multipliers[trigger] || 1.5;
  const promotionalGraceDays = isActive ? 3 : 0;

  return {
    trigger,
    startedAt,
    expiresAt,
    isActive,
    daysRemaining,
    receptivityMultiplier,
    promotionalGraceDays,
    recommendationMessage: isActive
      ? `Active discontinuity window: old context cues are broken. Maximize habit formation over the next ${daysRemaining} days.`
      : "Transition window has elapsed. Standard environmental friction applies.",
  };
}

// ─── 3. Disenchantment Score Tracker (#109) ──────────────────────────────

export interface DisenchantmentRating {
  dayIndex: number;
  rewardRating: number; // 1 to 10
  attestedAt: Date;
}

export interface DisenchantmentTrajectory {
  initialRating: number;
  currentRating: number;
  totalRatingsCount: number;
  devaluationPct: number;
  velocityPerDay: number;
  isTherapeuticMilestone: boolean;
  guidanceMessage: string;
}

export const DISENCHANTMENT_MILESTONE_THRESHOLD = 3.0;

export function calculateDisenchantmentTrajectory(
  ratings: DisenchantmentRating[],
): DisenchantmentTrajectory {
  if (!ratings || ratings.length === 0) {
    return {
      initialRating: 0,
      currentRating: 0,
      totalRatingsCount: 0,
      devaluationPct: 0,
      velocityPerDay: 0,
      isTherapeuticMilestone: false,
      guidanceMessage: "No disenchantment ratings recorded yet.",
    };
  }

  const sorted = [...ratings].sort((a, b) => a.dayIndex - b.dayIndex);
  const initialRating = sorted[0].rewardRating;
  const currentRating = sorted[sorted.length - 1].rewardRating;

  const drop = initialRating - currentRating;
  const devaluationPct = initialRating > 0 ? Math.round((drop / initialRating) * 100) : 0;

  const daysSpan = Math.max(1, sorted[sorted.length - 1].dayIndex - sorted[0].dayIndex);
  const velocityPerDay = Math.round((drop / daysSpan) * 100) / 100;

  const isTherapeuticMilestone = currentRating <= DISENCHANTMENT_MILESTONE_THRESHOLD && initialRating > 5;

  let guidanceMessage = "Reward value remains stable. Pay close mindfulness attention to physical sensations.";
  if (isTherapeuticMilestone) {
    guidanceMessage = `Therapeutic milestone reached: craving devaluation has fallen to ${currentRating}/10. The brain recognizes the hollow reward.`;
  } else if (devaluationPct > 25) {
    guidanceMessage = `Disenchantment underway: craving reward perception has dropped by ${devaluationPct}%.`;
  }

  return {
    initialRating,
    currentRating,
    totalRatingsCount: ratings.length,
    devaluationPct,
    velocityPerDay,
    isTherapeuticMilestone,
    guidanceMessage,
  };
}

// ─── 4. Bigger Better Offer (BBO) Substitution Engine (#102) ─────────────

export interface CravingSubstitution {
  trigger: string;
  habitToReplace: string;
  betterOfferBehavior: string;
  perceivedSatisfactionScore: number; // 1 to 10
  latencyFrictionSec: number;
}

export const CANONICAL_BBO_CATALOG: CravingSubstitution[] = [
  {
    trigger: "Evening stress or isolation",
    habitToReplace: "Doomscrolling social media",
    betterOfferBehavior: "10-minute cold shower followed by bilateral binaural audio",
    perceivedSatisfactionScore: 8.5,
    latencyFrictionSec: 30,
  },
  {
    trigger: "Post-breakup urge to text ex",
    habitToReplace: "Reaching for phone / texting ex",
    betterOfferBehavior: "Open Styx emergency voice memo and record unvarnished 2-minute reality audit",
    perceivedSatisfactionScore: 9.0,
    latencyFrictionSec: 10,
  },
  {
    trigger: "Mid-afternoon energy crash",
    habitToReplace: "Sugary snack or processed carb binge",
    betterOfferBehavior: "500ml ice water + 15 air squats + 3-minute breathwork",
    perceivedSatisfactionScore: 7.8,
    latencyFrictionSec: 45,
  },
  {
    trigger: "Pre-sleep anxiety",
    habitToReplace: "Streaming TV late in bed",
    betterOfferBehavior: "Weighted blanket + 10-minute non-sleep deep rest (NSDR)",
    perceivedSatisfactionScore: 8.8,
    latencyFrictionSec: 60,
  },
];

export function recommendBBO(triggerQuery: string): CravingSubstitution | null {
  const query = (triggerQuery || "").toLowerCase();
  for (const item of CANONICAL_BBO_CATALOG) {
    if (
      item.trigger.toLowerCase().includes(query) ||
      item.habitToReplace.toLowerCase().includes(query)
    ) {
      return item;
    }
  }
  return CANONICAL_BBO_CATALOG[1]; // default to emergency reality audit
}

/**
 * Calculates craving urge decay over time.
 * If substitution behavior was engaged within 3 minutes, urge resolves ~80% faster.
 */
export function calculateCravingUrgeDecay(
  initialUrgeScore: number, // 1 to 10
  minutesElapsed: number,
  substituted: boolean,
): number {
  const decayRate = substituted ? 0.35 : 0.08;
  const currentUrge = initialUrgeScore * Math.exp(-decayRate * minutesElapsed);
  return Math.max(1, Math.round(currentUrge * 10) / 10);
}

// ─── 5. Gateway Oath Tier — Two-Minute Rule Ladder (#99) ──────────────────

export enum GatewayLadderStage {
  TWO_MINUTE_GATEWAY = "TWO_MINUTE_GATEWAY",
  HABITUATION = "HABITUATION",
  FULL_OATH = "FULL_OATH",
}

export interface GatewayLadder {
  currentStage: GatewayLadderStage;
  streakAtStage: number;
  consecutiveRequired: number;
  readyForEscalation: boolean;
  nextStage: GatewayLadderStage | null;
  stageDescription: string;
}

export function evaluateGatewayLadder(
  currentStage: GatewayLadderStage,
  streakAtStage: number,
  consecutiveRequired = 5,
): GatewayLadder {
  let readyForEscalation = false;
  let nextStage: GatewayLadderStage | null = null;

  switch (currentStage) {
    case GatewayLadderStage.TWO_MINUTE_GATEWAY:
      readyForEscalation = streakAtStage >= consecutiveRequired;
      nextStage = readyForEscalation ? GatewayLadderStage.HABITUATION : null;
      return {
        currentStage,
        streakAtStage,
        consecutiveRequired,
        readyForEscalation,
        nextStage,
        stageDescription: "Stage 1: Two-Minute Gateway (Show up and execute for <= 2 minutes).",
      };

    case GatewayLadderStage.HABITUATION:
      readyForEscalation = streakAtStage >= consecutiveRequired;
      nextStage = readyForEscalation ? GatewayLadderStage.FULL_OATH : null;
      return {
        currentStage,
        streakAtStage,
        consecutiveRequired,
        readyForEscalation,
        nextStage,
        stageDescription: "Stage 2: Habituation (Scale duration to 10-15 minutes).",
      };

    case GatewayLadderStage.FULL_OATH:
    default:
      return {
        currentStage: GatewayLadderStage.FULL_OATH,
        streakAtStage,
        consecutiveRequired,
        readyForEscalation: false,
        nextStage: null,
        stageDescription: "Stage 3: Full Behavioral Oath (Standard high-stakes commitment).",
      };
  }
}

// ─── 6. Temptation Bundling Engine (#97) ─────────────────────────────────

export interface TemptationBundle {
  id: string;
  oughtBehavior: string; // The goal-directed habit (e.g. 45m workout)
  wantIndulgence: string; // The pleasurable reward (e.g. favorite podcast)
  gatingMode: "SIMULTANEOUS" | "CONTINGENT_REWARD";
  isRewardUnlocked: boolean;
  unlockedAt: Date | null;
}

export function createTemptationBundle(
  id: string,
  oughtBehavior: string,
  wantIndulgence: string,
  gatingMode: "SIMULTANEOUS" | "CONTINGENT_REWARD" = "CONTINGENT_REWARD",
): TemptationBundle {
  return {
    id,
    oughtBehavior,
    wantIndulgence,
    gatingMode,
    isRewardUnlocked: false,
    unlockedAt: null,
  };
}

export function unlockTemptationReward(
  bundle: TemptationBundle,
  proofVerified: boolean,
): TemptationBundle {
  if (!proofVerified) {
    return { ...bundle, isRewardUnlocked: false, unlockedAt: null };
  }
  return {
    ...bundle,
    isRewardUnlocked: true,
    unlockedAt: new Date(),
  };
}
