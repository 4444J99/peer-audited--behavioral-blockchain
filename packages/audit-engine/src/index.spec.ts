import { describe, it, expect } from "vitest";
import {
  calculateIntegrity,
  calculateAccuracy,
  calculateReviewerWeight,
  shouldDemoteFury,
  getAllowedTiers,
  getDisplayTier,
  ConsensusResolver,
  HoneypotEngine,
  LossAversionEngine,
  VolatilityEngine,
  FuryViolationCode,
  getViolationLabel,
  isFraudViolation,
} from "./index";

describe("Integrity Scoring", () => {
  it("calculates base integrity score", () => {
    const score = calculateIntegrity({
      userId: "test",
      completedOaths: 0,
      fraudStrikes: 0,
      failedOaths: 0,
      monthsInactive: 0,
    });
    expect(score).toBe(50);
  });

  it("adds bonus for completed oaths", () => {
    const score = calculateIntegrity({
      userId: "test",
      completedOaths: 10,
      fraudStrikes: 0,
      failedOaths: 0,
      monthsInactive: 0,
    });
    expect(score).toBe(100);
  });

  it("applies fraud penalty", () => {
    const score = calculateIntegrity({
      userId: "test",
      completedOaths: 0,
      fraudStrikes: 1,
      failedOaths: 0,
      monthsInactive: 0,
    });
    expect(score).toBe(35);
  });

  it("clamps to zero", () => {
    const score = calculateIntegrity({
      userId: "test",
      completedOaths: 0,
      fraudStrikes: 10,
      failedOaths: 10,
      monthsInactive: 0,
    });
    expect(score).toBe(0);
  });
});

describe("Fury Accuracy", () => {
  it("gives benefit of doubt to new Furies", () => {
    const accuracy = calculateAccuracy({
      furyId: "new",
      successfulAudits: 0,
      falseAccusations: 0,
      totalAudits: 0,
    });
    expect(accuracy).toBe(1.0);
  });

  it("penalizes false accusations 3x", () => {
    const accuracy = calculateAccuracy({
      furyId: "bad",
      successfulAudits: 5,
      falseAccusations: 5,
      totalAudits: 10,
    });
    // netSuccess = 5 - (5 * 3) = -10, ratio = -10/10 = -1, clamped to 0
    expect(accuracy).toBe(0.0);
  });

  it("calculates reviewer weight by tier", () => {
    const novice = calculateReviewerWeight({
      furyId: "novice",
      successfulAudits: 10,
      falseAccusations: 0,
      totalAudits: 10,
    });
    expect(novice).toBe(1.0);

    const journeyman = calculateReviewerWeight({
      furyId: "journeyman",
      successfulAudits: 55,
      falseAccusations: 1,
      totalAudits: 56,
    });
    expect(journeyman).toBe(1.5);

    const master = calculateReviewerWeight({
      furyId: "master",
      successfulAudits: 200,
      falseAccusations: 0,
      totalAudits: 200,
    });
    expect(master).toBe(2.0);
  });

  it("triggers demotion after burn-in", () => {
    expect(
      shouldDemoteFury({
        furyId: "bad",
        successfulAudits: 5,
        falseAccusations: 5,
        totalAudits: 10,
      }),
    ).toBe(true);

    expect(
      shouldDemoteFury({
        furyId: "new",
        successfulAudits: 1,
        falseAccusations: 5,
        totalAudits: 6,
      }),
    ).toBe(false); // Under burn-in
  });
});

describe("Tier Access", () => {
  it("restricts low scores", () => {
    expect(getAllowedTiers(10)).toEqual(["RESTRICTED_MODE"]);
  });

  it("unlocks tiers progressively", () => {
    expect(getAllowedTiers(150)).toContain("TIER_3_HIGH_ROLLER");
    expect(getAllowedTiers(600)).toContain("TIER_4_WHALE_VAULTS");
  });

  it("displays correct tier name", () => {
    expect(getDisplayTier(600)).toBe("WHALE");
    expect(getDisplayTier(150)).toBe("HIGH_ROLLER");
    expect(getDisplayTier(75)).toBe("STANDARD");
    expect(getDisplayTier(30)).toBe("MICRO");
    expect(getDisplayTier(10)).toBe("RESTRICTED");
  });
});

describe("Consensus Resolution", () => {
  it("returns UNCERTAIN for empty decisions", () => {
    const resolver = new ConsensusResolver();
    expect(resolver.resolve([])).toBe("UNCERTAIN");
  });

  it("resolves BREACH with sufficient weight", () => {
    const resolver = new ConsensusResolver();
    const decisions = [
      { auditorId: "a", integrityScore: 1.0, decision: "BREACH" as const },
      { auditorId: "b", integrityScore: 1.0, decision: "BREACH" as const },
      { auditorId: "c", integrityScore: 1.0, decision: "CLEAN" as const },
    ];
    expect(resolver.resolve(decisions)).toBe("BREACH");
  });

  it("resolves CLEAN with sufficient weight", () => {
    const resolver = new ConsensusResolver();
    const decisions = [
      { auditorId: "a", integrityScore: 1.0, decision: "CLEAN" as const },
      { auditorId: "b", integrityScore: 1.0, decision: "CLEAN" as const },
      { auditorId: "c", integrityScore: 0.5, decision: "BREACH" as const },
    ];
    // breachConfidence = 0.5 / 2.5 = 0.2 < 0.33 → CLEAN
    expect(resolver.resolve(decisions)).toBe("CLEAN");
  });
});

describe("Honeypot Engine", () => {
  it("generates honeypot artifacts", () => {
    const engine = new HoneypotEngine();
    const breach = engine.generateHoneypot("BREACH");
    expect(breach.isHoneypot).toBe(true);
    expect(breach.expectedResult).toBe("BREACH");

    const clean = engine.generateHoneypot("CLEAN");
    expect(clean.isHoneypot).toBe(true);
    expect(clean.expectedResult).toBe("CLEAN");
  });

  it("verifies auditor decisions", () => {
    const engine = new HoneypotEngine();
    expect(engine.verifyAuditor("BREACH", "BREACH")).toBe(true);
    expect(engine.verifyAuditor("CLEAN", "BREACH")).toBe(false);
  });
});

describe("Loss Aversion Engine", () => {
  it("calculates penalty multiplier", () => {
    const engine = new LossAversionEngine();
    const multiplier = engine.calculatePenaltyMultiplier(0.5);
    expect(multiplier).toBeGreaterThanOrEqual(1.5);
    expect(multiplier).toBeLessThanOrEqual(5.0);
  });

  it("calculates loss velocity", () => {
    const engine = new LossAversionEngine();
    expect(engine.calculateLossVelocity(0, 30)).toBe(1.0);
    expect(engine.calculateLossVelocity(30, 30)).toBe(0.0);
  });
});

describe("Volatility Engine", () => {
  it("returns standard multiplier for weekdays", () => {
    const engine = new VolatilityEngine();
    const tuesday = new Date("2026-06-09T12:00:00Z"); // Tuesday noon
    expect(engine.getTemporalMultiplier(tuesday)).toBe(1.0);
  });

  it("returns weekend vigil multiplier", () => {
    const engine = new VolatilityEngine();
    const saturday = new Date("2026-06-13T12:00:00Z"); // Saturday noon
    expect(engine.getTemporalMultiplier(saturday)).toBe(1.25);
  });

  it("returns peak vulnerability multiplier", () => {
    const engine = new VolatilityEngine();
    const lateNight = new Date("2026-06-09T02:00:00Z"); // Tuesday 2am
    expect(engine.getTemporalMultiplier(lateNight)).toBe(1.5);
  });
});

describe("Violation Codes", () => {
  it("has all codes defined", () => {
    expect(Object.keys(FuryViolationCode)).toHaveLength(16);
  });

  it("returns labels", () => {
    expect(getViolationLabel(FuryViolationCode.MEDIA_TAMPERED)).toBe(
      "Media Tampered",
    );
  });

  it("identifies fraud violations", () => {
    expect(isFraudViolation(FuryViolationCode.FRAUD_PREVIOUS_SUBMISSION)).toBe(
      true,
    );
    expect(isFraudViolation(FuryViolationCode.MEDIA_TAMPERED)).toBe(false);
  });
});
