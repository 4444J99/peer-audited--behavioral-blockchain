/**
 * Motivation Profiling at Intake (Issue #54)
 *
 * Tailors accountability levers, notification copy, and dashboard emphasis
 * based on user motivation archetype:
 * - FINANCIAL: Primary aversion to financial loss, stake-centric focus
 * - REPUTATIONAL: Primary aversion to public failure, streak and pride focus
 * - COMMUNAL: Primary drive toward group belonging and peer expectations
 * - ACHIEVEMENT: Primary drive toward milestones, badges, and personal mastery
 */

export const MOTIVATION_ARCHETYPES = [
  "FINANCIAL",
  "REPUTATIONAL",
  "COMMUNAL",
  "ACHIEVEMENT",
] as const;

export type MotivationArchetype = (typeof MOTIVATION_ARCHETYPES)[number];

export interface MotivationAssessmentAnswers {
  /** "What would bother you most about failing?" */
  failureAversion:
    | "LOSING_MONEY"
    | "PUBLIC_EXPOSURE"
    | "LETTING_DOWN_GROUP"
    | "MISSED_OPPORTUNITY";

  /** "What motivates you most to stay on track?" */
  primaryDriver:
    | "FINANCIAL_RETURN"
    | "PERSONAL_PRIDE"
    | "COMMUNITY_BELONGING"
    | "ACHIEVEMENT_BADGES";

  /** "Which accountability structure makes you most consistent?" */
  accountabilityPreference:
    | "STAKE_ON_LINE"
    | "AUDIENCE_VISIBILITY"
    | "POD_PARTNERSHIP"
    | "STREAK_PROGRESSION";

  /** "What is your biggest pitfall when motivation drops?" */
  primaryPitfall?:
    | "UNDERESTIMATING_RISK"
    | "FEAR_OF_JUDGMENT"
    | "ISOLATION"
    | "LOSS_OF_MOMENTUM";
}

export interface MotivationProfile {
  archetype: MotivationArchetype;
  scores: Record<MotivationArchetype, number>;
  recommendedAccountability: "STAKE" | "AUDIENCE" | "POD" | "SOLO_STREAK";
  dashboardEmphasis: "STAKE" | "REPUTATION" | "POD" | "MILESTONE";
}

/**
 * Classifies an intake assessment response into a deterministic MotivationProfile.
 */
export function classifyMotivationArchetype(
  answers: MotivationAssessmentAnswers,
): MotivationProfile {
  const scores: Record<MotivationArchetype, number> = {
    FINANCIAL: 0,
    REPUTATIONAL: 0,
    COMMUNAL: 0,
    ACHIEVEMENT: 0,
  };

  // 1. Failure aversion scoring
  switch (answers.failureAversion) {
    case "LOSING_MONEY":
      scores.FINANCIAL += 3;
      break;
    case "PUBLIC_EXPOSURE":
      scores.REPUTATIONAL += 3;
      break;
    case "LETTING_DOWN_GROUP":
      scores.COMMUNAL += 3;
      break;
    case "MISSED_OPPORTUNITY":
      scores.ACHIEVEMENT += 3;
      break;
  }

  // 2. Primary driver scoring
  switch (answers.primaryDriver) {
    case "FINANCIAL_RETURN":
      scores.FINANCIAL += 3;
      break;
    case "PERSONAL_PRIDE":
      scores.REPUTATIONAL += 3;
      break;
    case "COMMUNITY_BELONGING":
      scores.COMMUNAL += 3;
      break;
    case "ACHIEVEMENT_BADGES":
      scores.ACHIEVEMENT += 3;
      break;
  }

  // 3. Accountability preference scoring
  switch (answers.accountabilityPreference) {
    case "STAKE_ON_LINE":
      scores.FINANCIAL += 2;
      break;
    case "AUDIENCE_VISIBILITY":
      scores.REPUTATIONAL += 2;
      break;
    case "POD_PARTNERSHIP":
      scores.COMMUNAL += 2;
      break;
    case "STREAK_PROGRESSION":
      scores.ACHIEVEMENT += 2;
      break;
  }

  // 4. Primary pitfall modifier
  if (answers.primaryPitfall) {
    switch (answers.primaryPitfall) {
      case "UNDERESTIMATING_RISK":
        scores.FINANCIAL += 1;
        break;
      case "FEAR_OF_JUDGMENT":
        scores.REPUTATIONAL += 1;
        break;
      case "ISOLATION":
        scores.COMMUNAL += 1;
        break;
      case "LOSS_OF_MOMENTUM":
        scores.ACHIEVEMENT += 1;
        break;
    }
  }

  // Determine top archetype with stable tie-breaker
  let maxScore = -1;
  let topArchetype: MotivationArchetype = "FINANCIAL";

  for (const archetype of MOTIVATION_ARCHETYPES) {
    if (scores[archetype] > maxScore) {
      maxScore = scores[archetype];
      topArchetype = archetype;
    }
  }

  const recommendationMap: Record<
    MotivationArchetype,
    "STAKE" | "AUDIENCE" | "POD" | "SOLO_STREAK"
  > = {
    FINANCIAL: "STAKE",
    REPUTATIONAL: "AUDIENCE",
    COMMUNAL: "POD",
    ACHIEVEMENT: "SOLO_STREAK",
  };

  const dashboardMap: Record<
    MotivationArchetype,
    "STAKE" | "REPUTATION" | "POD" | "MILESTONE"
  > = {
    FINANCIAL: "STAKE",
    REPUTATIONAL: "REPUTATION",
    COMMUNAL: "POD",
    ACHIEVEMENT: "MILESTONE",
  };

  return {
    archetype: topArchetype,
    scores,
    recommendedAccountability: recommendationMap[topArchetype],
    dashboardEmphasis: dashboardMap[topArchetype],
  };
}

/**
 * Generates tailored notification copy aligned with the user's motivation archetype.
 */
export function getArchetypeNotificationCopy(
  archetype: MotivationArchetype,
  context: {
    stakeFormatted?: string;
    podName?: string;
    podCheckinCount?: number;
    podTotalCount?: number;
    currentDay?: number;
    totalDays?: number;
    streakDays?: number;
  } = {},
): { title: string; body: string } {
  const stake = context.stakeFormatted ?? "$30";
  const streak = context.streakDays ?? 1;
  const pod = context.podName ?? "Your Pod";
  const checkedIn = context.podCheckinCount ?? 3;
  const total = context.podTotalCount ?? 5;
  const day = context.currentDay ?? 14;
  const totalD = context.totalDays ?? 30;

  switch (archetype) {
    case "FINANCIAL":
      return {
        title: "Proof Required Today",
        body: `You have ${stake} committed on the line. Complete your check-in to preserve your funds.`,
      };
    case "REPUTATIONAL":
      return {
        title: "Keep Your Streak Intact",
        body: `Day ${streak} is active. Your audience and accountability circle are watching your commitment hold.`,
      };
    case "COMMUNAL":
      return {
        title: `${pod} Check-in`,
        body: `${checkedIn} of ${total} partners in ${pod} have verified today. Show up for your team.`,
      };
    case "ACHIEVEMENT":
      return {
        title: `Milestone Progress: Day ${day}/${totalD}`,
        body: `You are progressing toward your proof tier. Lock in today to advance to your next badge.`,
      };
  }
}
