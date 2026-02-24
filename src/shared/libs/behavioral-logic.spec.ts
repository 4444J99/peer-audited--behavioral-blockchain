import {
  OathCategory,
  VerificationMethod,
  validateOathMapping,
  useGraceDay,
  grantOnboardingBonus,
  isGoalEthical,
  MAX_GRACE_DAYS_PER_MONTH,
  ONBOARDING_BONUS_AMOUNT,
  MAX_NOCONTACT_DURATION_DAYS,
  MAX_NOCONTACT_TARGETS,
  NOCONTACT_MISS_STRIKE_THRESHOLD,
} from './behavioral-logic';

describe('behavioral-logic', () => {
  // ── validateOathMapping ─────────────────────────────────────────

  describe('validateOathMapping', () => {
    it('should allow HEALTHKIT for BIOLOGICAL_WEIGHT', () => {
      expect(
        validateOathMapping(OathCategory.WEIGHT_MANAGEMENT, VerificationMethod.HARDWARE_HEALTHKIT),
      ).toBe(true);
    });

    it('should allow HEALTHCONNECT for BIOLOGICAL_CARDIO', () => {
      expect(
        validateOathMapping(OathCategory.CARDIOVASCULAR_STAMINA, VerificationMethod.HARDWARE_HEALTHCONNECT),
      ).toBe(true);
    });

    it('should reject SCREENTIME for BIOLOGICAL_WEIGHT', () => {
      expect(
        validateOathMapping(OathCategory.WEIGHT_MANAGEMENT, VerificationMethod.API_SCREEN_TIME),
      ).toBe(false);
    });

    it('should allow SCREENTIME for COGNITIVE_DIGITAL', () => {
      expect(
        validateOathMapping(OathCategory.DIGITAL_FASTING, VerificationMethod.API_SCREEN_TIME),
      ).toBe(true);
    });

    it('should allow FURY_NETWORK for CREATIVE_WRITING', () => {
      expect(
        validateOathMapping(OathCategory.DEEP_WRITING, VerificationMethod.FURY_CONSENSUS),
      ).toBe(true);
    });

    it('should reject HEALTHKIT for CREATIVE_WRITING', () => {
      expect(
        validateOathMapping(OathCategory.DEEP_WRITING, VerificationMethod.HARDWARE_HEALTHKIT),
      ).toBe(false);
    });

    it('should return false for unknown stream prefix', () => {
      // Force an unknown stream prefix by casting a made-up category value
      expect(
        validateOathMapping('UNKNOWN_STREAM' as OathCategory, VerificationMethod.FURY_CONSENSUS),
      ).toBe(false);
    });
  });

  // ── useGraceDay ─────────────────────────────────────────────────

  describe('useGraceDay', () => {
    it('should succeed when grace days are available', () => {
      const currentEndsAt = new Date('2026-03-15T12:00:00Z');
      const result = useGraceDay(0, currentEndsAt);

      expect(result.success).toBe(true);
      expect(result.newDeadline).toBeDefined();
    });

    it('should extend deadline by 24 hours', () => {
      const currentEndsAt = new Date('2026-03-15T12:00:00Z');
      const result = useGraceDay(1, currentEndsAt);

      expect(result.success).toBe(true);
      const expectedDeadline = new Date('2026-03-16T12:00:00Z');
      expect(result.newDeadline!.getTime()).toBe(expectedDeadline.getTime());
    });

    it('should reject when MAX_GRACE_DAYS_PER_MONTH exceeded', () => {
      const currentEndsAt = new Date('2026-03-15T12:00:00Z');
      const result = useGraceDay(MAX_GRACE_DAYS_PER_MONTH, currentEndsAt);

      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/grace days/i);
      expect(result.newDeadline).toBeUndefined();
    });
  });

  // ── grantOnboardingBonus ────────────────────────────────────────

  describe('grantOnboardingBonus', () => {
    it('should grant $5 bonus for first contract (totalContracts=0)', () => {
      const result = grantOnboardingBonus(0);

      expect(result.granted).toBe(true);
      expect(result.amount).toBe(ONBOARDING_BONUS_AMOUNT);
      expect(result.reason).toBeUndefined();
    });

    it('should reject bonus for returning user (totalContracts>0)', () => {
      const result = grantOnboardingBonus(3);

      expect(result.granted).toBe(false);
      expect(result.amount).toBe(0);
      expect(result.reason).toMatch(/prior contracts/);
    });
  });

  // ── isGoalEthical ───────────────────────────────────────────────

  describe('isGoalEthical', () => {
    const originalEnv = process.env.GEMINI_API_KEY;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.GEMINI_API_KEY = originalEnv;
      } else {
        delete process.env.GEMINI_API_KEY;
      }
      jest.restoreAllMocks();
    });

    it('should pass through when no GEMINI_API_KEY is set', async () => {
      delete process.env.GEMINI_API_KEY;
      await expect(isGoalEthical('Lose 10 lbs')).resolves.toBe(true);
      await expect(isGoalEthical('something potentially problematic')).resolves.toBe(true);
      await expect(isGoalEthical('')).resolves.toBe(true);
    });

    it('should return true when Gemini approves the goal', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      jest.resetModules();
      jest.doMock('../../api/services/intelligence/GeminiClient', () => ({
        screenGoalEthics: jest.fn().mockResolvedValue({ ethical: true }),
      }));
      const { isGoalEthical: fn } = require('./behavioral-logic');
      await expect(fn('Run a 5K marathon')).resolves.toBe(true);
    });

    it('should return false when Gemini rejects the goal', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      jest.resetModules();
      jest.doMock('../../api/services/intelligence/GeminiClient', () => ({
        screenGoalEthics: jest.fn().mockResolvedValue({ ethical: false, reason: 'Self-harm risk' }),
      }));
      const { isGoalEthical: fn } = require('./behavioral-logic');
      await expect(fn('Starve myself to lose weight')).resolves.toBe(false);
    });

    it('should fail open when Gemini throws an error', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      jest.resetModules();
      jest.doMock('../../api/services/intelligence/GeminiClient', () => ({
        screenGoalEthics: jest.fn().mockRejectedValue(new Error('Gemini down')),
      }));
      const { isGoalEthical: fn } = require('./behavioral-logic');
      await expect(fn('Any goal')).resolves.toBe(true);
    });
  });

  // ── Recovery Stream ───────────────────────────────────────────

  describe('RECOVERY oath stream', () => {
    it('should have 4 RECOVERY oath categories', () => {
      const recoveryOaths = Object.values(OathCategory).filter(v => (v as string).startsWith('RECOVERY_'));
      expect(recoveryOaths).toHaveLength(4);
    });

    it('should include DAILY_ATTESTATION verification method', () => {
      expect(VerificationMethod.DAILY_ATTESTATION).toBe('ATTESTATION');
    });

    it('should allow ATTESTATION for RECOVERY_NOCONTACT', () => {
      expect(
        validateOathMapping(OathCategory.NO_CONTACT_BOUNDARY, VerificationMethod.DAILY_ATTESTATION),
      ).toBe(true);
    });

    it('should allow SCREENTIME for RECOVERY_DETOX', () => {
      expect(
        validateOathMapping(OathCategory.BEHAVIORAL_DETOX, VerificationMethod.API_SCREEN_TIME),
      ).toBe(true);
    });

    it('should allow FURY_NETWORK for RECOVERY_SUBSTANCE', () => {
      expect(
        validateOathMapping(OathCategory.SUBSTANCE_ABSTINENCE, VerificationMethod.FURY_CONSENSUS),
      ).toBe(true);
    });

    it('should reject HEALTHKIT for RECOVERY_NOCONTACT', () => {
      expect(
        validateOathMapping(OathCategory.NO_CONTACT_BOUNDARY, VerificationMethod.HARDWARE_HEALTHKIT),
      ).toBe(false);
    });

    it('should reject GPS for RECOVERY_AVOIDANCE', () => {
      expect(
        validateOathMapping(OathCategory.ENVIRONMENT_AVOIDANCE, VerificationMethod.GPS_GEOFENCE),
      ).toBe(false);
    });

    it('should export recovery-specific constants', () => {
      expect(MAX_NOCONTACT_DURATION_DAYS).toBe(30);
      expect(MAX_NOCONTACT_TARGETS).toBe(3);
      expect(NOCONTACT_MISS_STRIKE_THRESHOLD).toBe(3);
    });
  });

});
