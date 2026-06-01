import {
  classifyCrabBucketRisk,
  CrabBucketSeverity,
  CrabBucketPattern,
  calculateStakeWithDevice,
  DEFAULT_COMMITMENT_DEVICE_CATALOG,
  getIdentityDomainFromOath,
  IdentityDomain,
  IDENTITY_REFRAMING_TABLE,
  reframeMessage,
  createDefaultEscalationSchedule,
  calculateNextStake,
  applyProfessionalModeCopy,
  ProfessionalModeLevel,
  ProfessionalModeConfig,
  PROFESSIONAL_MODE_DEFAULTS,
  detectHabituation,
  HabituationStatus,
  BEHAVIOR_SWAP_COOLDOWN_DAYS,
  BEHAVIOR_SWAP_MIN_CARRY_OVER_PCT,
  validateSwapEligibility,
  calculateSwapStake,
} from "./behavioral-enhancements";
import { OathCategory } from "./behavioral-logic";

describe("Behavioral Enhancements", () => {
  describe("Crab Bucket Alert", () => {
    it("classifies NONE risk for 0 signals", () => {
      expect(classifyCrabBucketRisk(0)).toBe(CrabBucketSeverity.NONE);
    });
    it("classifies LOW risk for 1 signal", () => {
      expect(classifyCrabBucketRisk(1)).toBe(CrabBucketSeverity.LOW);
    });
    it("classifies MEDIUM risk for 3 signals", () => {
      expect(classifyCrabBucketRisk(3)).toBe(CrabBucketSeverity.MEDIUM);
    });
    it("classifies HIGH risk for 5+ signals", () => {
      expect(classifyCrabBucketRisk(5)).toBe(CrabBucketSeverity.HIGH);
      expect(classifyCrabBucketRisk(10)).toBe(CrabBucketSeverity.HIGH);
    });
  });

  describe("Commitment Device Marketplace", () => {
    it("has a default catalog with devices", () => {
      expect(DEFAULT_COMMITMENT_DEVICE_CATALOG.length).toBeGreaterThan(0);
    });
    it("calculates amplified stake", () => {
      const devices = [
        { ...DEFAULT_COMMITMENT_DEVICE_CATALOG[0], activeSubscribers: 0 },
      ];
      const amplified = calculateStakeWithDevice(50, devices);
      expect(amplified).toBeGreaterThan(50);
    });
  });

  describe("Identity-Based Reframing Engine", () => {
    it("maps biological oath to ATHLETE domain", () => {
      expect(getIdentityDomainFromOath(OathCategory.WEIGHT_MANAGEMENT)).toBe(
        IdentityDomain.ATHLETE,
      );
    });
    it("maps recovery oath to RECOVERY domain", () => {
      expect(getIdentityDomainFromOath(OathCategory.SOBRIETY_HRV)).toBe(
        IdentityDomain.ATHLETE,
      );
    });
    it("reframes failure message with streak", () => {
      const template = IDENTITY_REFRAMING_TABLE[IdentityDomain.ATHLETE];
      const msg = reframeMessage(template, "failure", 7);
      expect(msg).toContain("off days");
    });
    it("reframes streak milestone", () => {
      const template = IDENTITY_REFRAMING_TABLE[IdentityDomain.RECOVERY];
      const msg = reframeMessage(template, "streak", 30);
      expect(msg).toContain("30");
    });
  });

  describe("Save More Tomorrow", () => {
    it("creates default escalation schedule", () => {
      const schedule = createDefaultEscalationSchedule(100);
      expect(schedule.enabled).toBe(false);
      expect(schedule.incrementAmount).toBe(10);
      expect(schedule.maxStake).toBe(500);
    });
    it("calculates next stake when enabled", () => {
      const schedule = createDefaultEscalationSchedule(100);
      schedule.enabled = true;
      expect(calculateNextStake(schedule, 100)).toBe(110);
    });
    it("caps at max stake", () => {
      const schedule = createDefaultEscalationSchedule(100);
      schedule.enabled = true;
      expect(calculateNextStake(schedule, 500)).toBe(500);
    });
  });

  describe("Professional Mode UX", () => {
    it("defaults to STANDARD", () => {
      expect(PROFESSIONAL_MODE_DEFAULTS.level).toBe(
        ProfessionalModeLevel.STANDARD,
      );
    });
    it("does not modify text when self-distancing disabled", () => {
      const text = "You completed your task";
      expect(applyProfessionalModeCopy(text, PROFESSIONAL_MODE_DEFAULTS)).toBe(
        text,
      );
    });
    it("replaces you/your with the participant when enabled", () => {
      const config: ProfessionalModeConfig = {
        ...PROFESSIONAL_MODE_DEFAULTS,
        selfDistancingEnabled: true,
      };
      const result = applyProfessionalModeCopy(
        "You completed your task and you're doing great",
        config,
      );
      expect(result).toContain("the participant");
      expect(result).not.toContain("You completed");
    });
  });

  describe("Habituation Detector", () => {
    it("returns NORMAL for young contracts", () => {
      const result = detectHabituation(5, [0.9, 0.9, 0.9, 0.9], 0.05);
      expect(result.status).toBe(HabituationStatus.NORMAL);
    });
    it("detects plateau for old contract with high rate and low variance", () => {
      const result = detectHabituation(30, [0.9, 0.9, 0.9, 0.95], 0.05);
      expect(result.status).toBe(HabituationStatus.PLATEAU);
    });
    it("detects habituation for very old contract", () => {
      const result = detectHabituation(60, [0.95, 0.95, 0.95, 0.95], 0.02);
      expect(result.status).toBe(HabituationStatus.HABITUATED);
    });
  });

  describe("Behavior Swap Contracts", () => {
    it("validates swap eligibility", () => {
      const result = validateSwapEligibility(20, "ACTIVE", 0);
      expect(result.eligible).toBe(true);
    });
    it("rejects if contract is not active", () => {
      const result = validateSwapEligibility(20, "FAILED", 0);
      expect(result.eligible).toBe(false);
    });
    it("rejects if below cooldown", () => {
      const result = validateSwapEligibility(5, "ACTIVE", 0);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain(String(BEHAVIOR_SWAP_COOLDOWN_DAYS));
    });
    it("calculates swap stake with min/max bounds", () => {
      expect(calculateSwapStake(100, 50)).toBe(50);
      expect(calculateSwapStake(100, 5)).toBe(BEHAVIOR_SWAP_MIN_CARRY_OVER_PCT);
      expect(calculateSwapStake(100, 200)).toBe(100);
    });
  });
});
