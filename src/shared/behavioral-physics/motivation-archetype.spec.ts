import {
  classifyMotivationArchetype,
  getArchetypeNotificationCopy,
  MOTIVATION_ARCHETYPES,
} from "../libs/motivation-archetype";

describe("Motivation Profiling at Intake (Issue #54)", () => {
  it("defines the canonical 4 motivation archetypes", () => {
    expect(MOTIVATION_ARCHETYPES).toEqual([
      "FINANCIAL",
      "REPUTATIONAL",
      "COMMUNAL",
      "ACHIEVEMENT",
    ]);
  });

  it("classifies financial loss aversion to FINANCIAL archetype", () => {
    const profile = classifyMotivationArchetype({
      failureAversion: "LOSING_MONEY",
      primaryDriver: "FINANCIAL_RETURN",
      accountabilityPreference: "STAKE_ON_LINE",
      primaryPitfall: "UNDERESTIMATING_RISK",
    });

    expect(profile.archetype).toBe("FINANCIAL");
    expect(profile.recommendedAccountability).toBe("STAKE");
    expect(profile.dashboardEmphasis).toBe("STAKE");
    expect(profile.scores.FINANCIAL).toBeGreaterThan(profile.scores.COMMUNAL);

    const copy = getArchetypeNotificationCopy("FINANCIAL", { stakeFormatted: "$50" });
    expect(copy.body).toContain("$50 committed");
  });

  it("classifies reputation and pride to REPUTATIONAL archetype", () => {
    const profile = classifyMotivationArchetype({
      failureAversion: "PUBLIC_EXPOSURE",
      primaryDriver: "PERSONAL_PRIDE",
      accountabilityPreference: "AUDIENCE_VISIBILITY",
      primaryPitfall: "FEAR_OF_JUDGMENT",
    });

    expect(profile.archetype).toBe("REPUTATIONAL");
    expect(profile.recommendedAccountability).toBe("AUDIENCE");
    expect(profile.dashboardEmphasis).toBe("REPUTATION");

    const copy = getArchetypeNotificationCopy("REPUTATIONAL", { streakDays: 7 });
    expect(copy.body).toContain("Day 7 is active");
  });

  it("classifies pod and group belonging to COMMUNAL archetype", () => {
    const profile = classifyMotivationArchetype({
      failureAversion: "LETTING_DOWN_GROUP",
      primaryDriver: "COMMUNITY_BELONGING",
      accountabilityPreference: "POD_PARTNERSHIP",
      primaryPitfall: "ISOLATION",
    });

    expect(profile.archetype).toBe("COMMUNAL");
    expect(profile.recommendedAccountability).toBe("POD");
    expect(profile.dashboardEmphasis).toBe("POD");

    const copy = getArchetypeNotificationCopy("COMMUNAL", {
      podName: "Alpha Pod",
      podCheckinCount: 4,
      podTotalCount: 5,
    });
    expect(copy.title).toBe("Alpha Pod Check-in");
    expect(copy.body).toContain("4 of 5 partners");
  });

  it("classifies milestone badges to ACHIEVEMENT archetype", () => {
    const profile = classifyMotivationArchetype({
      failureAversion: "MISSED_OPPORTUNITY",
      primaryDriver: "ACHIEVEMENT_BADGES",
      accountabilityPreference: "STREAK_PROGRESSION",
      primaryPitfall: "LOSS_OF_MOMENTUM",
    });

    expect(profile.archetype).toBe("ACHIEVEMENT");
    expect(profile.recommendedAccountability).toBe("SOLO_STREAK");
    expect(profile.dashboardEmphasis).toBe("MILESTONE");

    const copy = getArchetypeNotificationCopy("ACHIEVEMENT", {
      currentDay: 15,
      totalDays: 30,
    });
    expect(copy.title).toContain("Day 15/30");
  });
});
