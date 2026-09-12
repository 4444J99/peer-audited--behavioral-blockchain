import {
  parseImplementationIntention,
  verifyProofTimestampAgainstIntention,
  calculateHaversineDistanceMeters,
  verifyProofLocationAgainstIntention,
  detectDiscontinuityWindow,
  DiscontinuityTrigger,
  calculateDisenchantmentTrajectory,
  recommendBBO,
  calculateCravingUrgeDecay,
  evaluateGatewayLadder,
  GatewayLadderStage,
  createTemptationBundle,
  unlockTemptationReward,
} from "./behavioral-science-suite";

describe("Behavioral Science Suite", () => {
  describe("1. Implementation Intentions Engine (#111)", () => {
    it("parses valid implementation intention statements with time and location", () => {
      const intention = parseImplementationIntention(
        "I will do 50 pushups at 07:30 in Equinox Downtown",
      );
      expect(intention).not.toBeNull();
      expect(intention?.behavior).toBe("do 50 pushups");
      expect(intention?.declaredTime).toBe("07:30");
      expect(intention?.location?.name).toBe("Equinox Downtown");
      expect(intention?.location?.radiusMeters).toBe(200);
    });

    it("parses 12-hour AM/PM times and normalizes to 24-hour HH:MM", () => {
      const morning = parseImplementationIntention("I will meditate at 8:15 AM");
      expect(morning?.declaredTime).toBe("08:15");

      const evening = parseImplementationIntention(
        "I will write 500 words at 9:45 PM in Central Library",
      );
      expect(evening?.declaredTime).toBe("21:45");
      expect(evening?.location?.name).toBe("Central Library");
    });

    it("returns null for malformed statements", () => {
      expect(parseImplementationIntention("I want to run sometime")).toBeNull();
      expect(parseImplementationIntention("")).toBeNull();
    });

    it("verifies proof submission timestamp within ±30 min tolerance", () => {
      // Target: 08:00
      const onTime = new Date("2026-09-12T08:15:00");
      const checkOnTime = verifyProofTimestampAgainstIntention(onTime, "08:00", 30);
      expect(checkOnTime.valid).toBe(true);
      expect(checkOnTime.deltaMinutes).toBe(15);

      // 45 min late -> invalid
      const late = new Date("2026-09-12T08:45:00");
      const checkLate = verifyProofTimestampAgainstIntention(late, "08:00", 30);
      expect(checkLate.valid).toBe(false);
      expect(checkLate.deltaMinutes).toBe(45);
    });

    it("handles midnight wrap-around accurately in time verification", () => {
      const lateNight = new Date("2026-09-12T23:55:00");
      const earlyMorning = verifyProofTimestampAgainstIntention(lateNight, "00:05", 30);
      expect(earlyMorning.valid).toBe(true);
      expect(earlyMorning.deltaMinutes).toBe(10);
    });

    it("verifies GPS proof against declared location geofence", () => {
      const gymLocation = {
        name: "Gym",
        latitude: 40.7128,
        longitude: -74.006,
        radiusMeters: 200,
      };

      // 50 meters away
      const insideGeofence = { latitude: 40.7131, longitude: -74.0061 };
      const checkInside = verifyProofLocationAgainstIntention(insideGeofence, gymLocation);
      expect(checkInside.valid).toBe(true);
      expect(checkInside.distanceMeters).toBeLessThan(200);

      // 5 km away
      const outsideGeofence = { latitude: 40.7589, longitude: -73.9851 };
      const checkOutside = verifyProofLocationAgainstIntention(outsideGeofence, gymLocation);
      expect(checkOutside.valid).toBe(false);
      expect(checkOutside.distanceMeters).toBeGreaterThan(200);
    });
  });

  describe("2. Habit Discontinuity Window Detector (#110)", () => {
    it("identifies active discontinuity window within 30 days of transition", () => {
      const now = new Date("2026-09-12T12:00:00Z");
      const recentRelocation = new Date("2026-09-02T12:00:00Z"); // 10 days ago

      const window = detectDiscontinuityWindow(
        DiscontinuityTrigger.RELOCATION,
        recentRelocation,
        now,
      );

      expect(window.isActive).toBe(true);
      expect(window.daysRemaining).toBe(20);
      expect(window.receptivityMultiplier).toBe(2.2);
      expect(window.promotionalGraceDays).toBe(3);
      expect(window.recommendationMessage).toContain("Active discontinuity window");
    });

    it("marks window expired after 30 days have elapsed", () => {
      const now = new Date("2026-09-12T12:00:00Z");
      const oldMove = new Date("2026-07-01T12:00:00Z"); // > 70 days ago

      const window = detectDiscontinuityWindow(
        DiscontinuityTrigger.SCHEDULE_SHIFT,
        oldMove,
        now,
      );

      expect(window.isActive).toBe(false);
      expect(window.daysRemaining).toBe(0);
      expect(window.promotionalGraceDays).toBe(0);
    });
  });

  describe("3. Disenchantment Score Tracker (#109)", () => {
    it("calculates craving devaluation velocity and detects therapeutic milestone", () => {
      const ratings = [
        { dayIndex: 1, rewardRating: 8.5, attestedAt: new Date("2026-08-01") },
        { dayIndex: 7, rewardRating: 7.0, attestedAt: new Date("2026-08-07") },
        { dayIndex: 14, rewardRating: 4.8, attestedAt: new Date("2026-08-14") },
        { dayIndex: 21, rewardRating: 2.5, attestedAt: new Date("2026-08-21") },
      ];

      const trajectory = calculateDisenchantmentTrajectory(ratings);

      expect(trajectory.initialRating).toBe(8.5);
      expect(trajectory.currentRating).toBe(2.5);
      expect(trajectory.devaluationPct).toBe(71); // (8.5 - 2.5)/8.5 = 70.58% -> 71%
      expect(trajectory.isTherapeuticMilestone).toBe(true);
      expect(trajectory.guidanceMessage).toContain("Therapeutic milestone reached");
    });

    it("returns safe defaults when no ratings are provided", () => {
      const trajectory = calculateDisenchantmentTrajectory([]);
      expect(trajectory.totalRatingsCount).toBe(0);
      expect(trajectory.isTherapeuticMilestone).toBe(false);
    });
  });

  describe("4. Bigger Better Offer (BBO) Substitution Engine (#102)", () => {
    it("recommends tailored BBO from catalog based on craving trigger", () => {
      const rec = recommendBBO("texting ex");
      expect(rec).not.toBeNull();
      expect(rec?.betterOfferBehavior).toContain("emergency voice memo");
      expect(rec?.perceivedSatisfactionScore).toBe(9.0);
    });

    it("calculates accelerated urge decay when substitution behavior is engaged", () => {
      const initialUrge = 9.0;
      const minutesElapsed = 10;

      const urgeWithBBO = calculateCravingUrgeDecay(initialUrge, minutesElapsed, true);
      const urgeWithoutBBO = calculateCravingUrgeDecay(initialUrge, minutesElapsed, false);

      // With BBO (decay rate 0.35), urge after 10 min drops to ~1.0
      expect(urgeWithBBO).toBeLessThan(urgeWithoutBBO);
      expect(urgeWithBBO).toBeLessThanOrEqual(2.0);
    });
  });

  describe("5. Gateway Oath Tier — Two-Minute Rule Ladder (#99)", () => {
    it("evaluates Stage 1 Two-Minute Gateway and triggers escalation at streak >= 5", () => {
      const underThreshold = evaluateGatewayLadder(GatewayLadderStage.TWO_MINUTE_GATEWAY, 3);
      expect(underThreshold.readyForEscalation).toBe(false);
      expect(underThreshold.nextStage).toBeNull();

      const atThreshold = evaluateGatewayLadder(GatewayLadderStage.TWO_MINUTE_GATEWAY, 5);
      expect(atThreshold.readyForEscalation).toBe(true);
      expect(atThreshold.nextStage).toBe(GatewayLadderStage.HABITUATION);
    });

    it("evaluates Stage 2 Habituation and escalates to Full Oath", () => {
      const habituated = evaluateGatewayLadder(GatewayLadderStage.HABITUATION, 6);
      expect(habituated.readyForEscalation).toBe(true);
      expect(habituated.nextStage).toBe(GatewayLadderStage.FULL_OATH);
    });
  });

  describe("6. Temptation Bundling Engine (#97)", () => {
    it("creates temptation bundle with locked reward until proof is verified", () => {
      const bundle = createTemptationBundle(
        "bundle-1",
        "45-minute zone 2 rowing",
        "Listen to favorite crime podcast",
      );

      expect(bundle.isRewardUnlocked).toBe(false);
      expect(bundle.unlockedAt).toBeNull();

      const unlocked = unlockTemptationReward(bundle, true);
      expect(unlocked.isRewardUnlocked).toBe(true);
      expect(unlocked.unlockedAt).toBeInstanceOf(Date);

      const failedVerification = unlockTemptationReward(bundle, false);
      expect(failedVerification.isRewardUnlocked).toBe(false);
    });
  });
});
