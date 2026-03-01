import { AegisProtocolService } from './aegis.service';
import { HttpException } from '@nestjs/common';

describe('AegisProtocolService', () => {
  let service: AegisProtocolService;

  beforeEach(() => {
    service = new AegisProtocolService();
  });

  describe('validatePsychologicalGuardrails', () => {
    it('should pass for a safe contract (10000¢ stake, 30 days, good score)', () => {
      const isValid = service.validatePsychologicalGuardrails(10000, 30, 80, 0);
      expect(isValid).toBe(true);
    });

    it('should throw HttpException (406) if stake exceeds absolute ceiling (50000¢)', () => {
      expect(() => {
        service.validatePsychologicalGuardrails(60000, 30, 90, 0);
      }).toThrow(/Proposed stake .* exceeds the absolute psychological safety ceiling/);
    });

    it('should throw HttpException (406) if duration is too short (< 7 days)', () => {
      expect(() => {
        service.validatePsychologicalGuardrails(5000, 5, 80, 0);
      }).toThrow(/Proposed duration .* is beneath the clinical threshold/);
    });

    it('should throw HttpException (406) to prevent downward spiral (3+ failures & >5000¢ stake)', () => {
      expect(() => {
        service.validatePsychologicalGuardrails(10000, 14, 80, 4);
      }).toThrow(/After 4 recent contract failures, your maximum allowed stake is strictly capped/);
    });

    it('should throw HttpException (406) if integrity score is low (< 40) and stake is high (>10000¢)', () => {
      expect(() => {
        service.validatePsychologicalGuardrails(20000, 14, 30, 0);
      }).toThrow(/A low Integrity Score .* restricts stakes to a maximum/);
    });
  });

  describe('validateHealthMetrics', () => {
    it('should pass when no health metrics are provided (non-biological oath)', () => {
      expect(service.validateHealthMetrics(undefined)).toBe(true);
    });

    it('should pass for normal BMI and safe weight loss rate', () => {
      // 180 lbs, 70 inches → BMI = (180/4900)*703 ≈ 25.8
      // Target 170 lbs over 70 days (10 weeks) → 1 lb/week → 0.56%/week
      const result = service.validateHealthMetrics(
        { currentWeightLbs: 180, heightInches: 70, targetWeightLbs: 170 },
        70,
      );
      expect(result).toBe(true);
    });

    it('should reject when BMI is below 18.5', () => {
      // 100 lbs, 70 inches → BMI = (100/4900)*703 ≈ 14.3
      expect(() => {
        service.validateHealthMetrics(
          { currentWeightLbs: 100, heightInches: 70, targetWeightLbs: 95 },
          30,
        );
      }).toThrow(/Aegis Health Guard.*below the medical safety floor/);
    });

    it('should reject when weekly weight loss velocity exceeds 2%', () => {
      // 200 lbs, 70 inches → BMI ≈ 28.7 (ok)
      // Target 160 lbs over 14 days (2 weeks) → 20 lbs / 2 weeks = 10 lbs/week → 5%/week
      expect(() => {
        service.validateHealthMetrics(
          { currentWeightLbs: 200, heightInches: 70, targetWeightLbs: 160 },
          14,
        );
      }).toThrow(/Aegis Velocity Guard.*exceeds the safe maximum/);
    });

    it('should allow weight gain targets (no velocity cap)', () => {
      // Target weight is higher — this is gain, not loss
      const result = service.validateHealthMetrics(
        { currentWeightLbs: 150, heightInches: 68, targetWeightLbs: 160 },
        30,
      );
      expect(result).toBe(true);
    });
  });
});
