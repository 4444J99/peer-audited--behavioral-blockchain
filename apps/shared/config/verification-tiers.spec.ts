import {
  VerificationTier,
  getVerificationTier,
  getVerificationTierConfig,
  getEffectiveVerificationTier,
  validateProofMedia,
  VERIFICATION_TIERS,
  RISK_ESCALATION,
} from "./verification-tiers";

describe("verification-tiers", () => {
  describe("getVerificationTier", () => {
    it("returns STANDARD for stakes under $50", () => {
      expect(getVerificationTier(0)).toBe(VerificationTier.STANDARD);
      expect(getVerificationTier(1000)).toBe(VerificationTier.STANDARD); // $10
      expect(getVerificationTier(4999)).toBe(VerificationTier.STANDARD); // $49.99
    });

    it("returns ELEVATED for stakes at $50 to under $100", () => {
      expect(getVerificationTier(5000)).toBe(VerificationTier.ELEVATED); // exactly $50
      expect(getVerificationTier(7500)).toBe(VerificationTier.ELEVATED); // $75
      expect(getVerificationTier(9999)).toBe(VerificationTier.ELEVATED); // $99.99
    });

    it("returns HIGH_STAKES for stakes at $100+", () => {
      expect(getVerificationTier(10000)).toBe(VerificationTier.HIGH_STAKES); // exactly $100
      expect(getVerificationTier(50000)).toBe(VerificationTier.HIGH_STAKES); // $500
      expect(getVerificationTier(100000)).toBe(VerificationTier.HIGH_STAKES); // $1000
    });

    it("treats boundary amounts as exclusive upper bound (escalates at threshold)", () => {
      // Exactly $50 should escalate to ELEVATED, not stay in STANDARD
      expect(getVerificationTier(5000)).toBe(VerificationTier.ELEVATED);
      // Exactly $100 should escalate to HIGH_STAKES
      expect(getVerificationTier(10000)).toBe(VerificationTier.HIGH_STAKES);
    });
  });

  describe("getVerificationTierConfig", () => {
    it("returns correct config for each tier", () => {
      const standard = getVerificationTierConfig(VerificationTier.STANDARD);
      expect(standard.requiresVideo).toBe(false);
      expect(standard.requiresHumanReview).toBe(false);
      expect(standard.requiresAnomalyDetection).toBe(false);

      const elevated = getVerificationTierConfig(VerificationTier.ELEVATED);
      expect(elevated.requiresVideo).toBe(true);
      expect(elevated.requiresHumanReview).toBe(false);
      expect(elevated.requiresAnomalyDetection).toBe(false);

      const highStakes = getVerificationTierConfig(
        VerificationTier.HIGH_STAKES,
      );
      expect(highStakes.requiresVideo).toBe(true);
      expect(highStakes.requiresHumanReview).toBe(true);
      expect(highStakes.requiresAnomalyDetection).toBe(true);
    });
  });

  describe("getEffectiveVerificationTier", () => {
    it("returns stake-based tier when no risk signals", () => {
      expect(getEffectiveVerificationTier(1000)).toBe(
        VerificationTier.STANDARD,
      );
      expect(getEffectiveVerificationTier(7500)).toBe(
        VerificationTier.ELEVATED,
      );
      expect(getEffectiveVerificationTier(50000)).toBe(
        VerificationTier.HIGH_STAKES,
      );
    });

    it("escalates one tier for low integrity score", () => {
      // STANDARD → ELEVATED
      expect(
        getEffectiveVerificationTier(1000, 30), // score 30 < threshold 50
      ).toBe(VerificationTier.ELEVATED);

      // ELEVATED → HIGH_STAKES
      expect(getEffectiveVerificationTier(7500, 30)).toBe(
        VerificationTier.HIGH_STAKES,
      );

      // HIGH_STAKES stays HIGH_STAKES (ceiling)
      expect(getEffectiveVerificationTier(50000, 30)).toBe(
        VerificationTier.HIGH_STAKES,
      );
    });

    it("does NOT escalate for integrity score at or above threshold", () => {
      expect(
        getEffectiveVerificationTier(1000, 50), // exactly at threshold
      ).toBe(VerificationTier.STANDARD);

      expect(
        getEffectiveVerificationTier(1000, 100), // above threshold
      ).toBe(VerificationTier.STANDARD);
    });

    it("escalates one tier for fraud strikes", () => {
      expect(getEffectiveVerificationTier(1000, undefined, 1)).toBe(
        VerificationTier.ELEVATED,
      );

      expect(getEffectiveVerificationTier(7500, undefined, 2)).toBe(
        VerificationTier.HIGH_STAKES,
      );
    });

    it("escalates directly to HIGH_STAKES for pHash duplicate", () => {
      expect(
        getEffectiveVerificationTier(1000, undefined, undefined, true),
      ).toBe(VerificationTier.HIGH_STAKES);

      // pHash override takes priority over score-based escalation
      expect(getEffectiveVerificationTier(1000, 100, 0, true)).toBe(
        VerificationTier.HIGH_STAKES,
      );
    });

    it("stacks escalations (low score + fraud strikes)", () => {
      // STANDARD + low score → ELEVATED, then + fraud strikes → HIGH_STAKES
      expect(getEffectiveVerificationTier(1000, 30, 1)).toBe(
        VerificationTier.HIGH_STAKES,
      );
    });

    it("respects HIGH_STAKES ceiling", () => {
      // Already HIGH_STAKES + risk signals → stays HIGH_STAKES
      expect(getEffectiveVerificationTier(50000, 10, 5, true)).toBe(
        VerificationTier.HIGH_STAKES,
      );
    });
  });

  describe("validateProofMedia", () => {
    it("accepts photo-only for STANDARD tier", () => {
      expect(validateProofMedia(VerificationTier.STANDARD, false)).toBeNull();
    });

    it("accepts video for STANDARD tier", () => {
      expect(validateProofMedia(VerificationTier.STANDARD, true)).toBeNull();
    });

    it("rejects photo-only for ELEVATED tier", () => {
      const error = validateProofMedia(VerificationTier.ELEVATED, false);
      expect(error).toContain("requires continuous video proof");
    });

    it("accepts video for ELEVATED tier", () => {
      expect(validateProofMedia(VerificationTier.ELEVATED, true)).toBeNull();
    });

    it("rejects photo-only for HIGH_STAKES tier", () => {
      const error = validateProofMedia(VerificationTier.HIGH_STAKES, false);
      expect(error).toContain("requires continuous video proof");
    });

    it("accepts video for HIGH_STAKES tier", () => {
      expect(validateProofMedia(VerificationTier.HIGH_STAKES, true)).toBeNull();
    });
  });

  describe("constants", () => {
    it("has 3 verification tiers", () => {
      expect(VERIFICATION_TIERS).toHaveLength(3);
    });

    it("has correct risk escalation thresholds", () => {
      expect(RISK_ESCALATION.INTEGRITY_SCORE_THRESHOLD).toBe(50);
      expect(RISK_ESCALATION.FRAUD_STRIKE_THRESHOLD).toBe(1);
      expect(RISK_ESCALATION.PHASH_DUPLICATE_DIRECT).toBe(true);
    });
  });
});
