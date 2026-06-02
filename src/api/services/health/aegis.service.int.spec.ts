import { HttpException, HttpStatus } from '@nestjs/common';
import { AegisProtocolService } from './aegis.service';
import {
  MAX_WEEKLY_LOSS_VELOCITY_PCT,
  MIN_SAFE_BMI,
} from '../../../shared/libs/behavioral-logic';

describe('AegisProtocolService (Integration)', () => {
  let service: AegisProtocolService;

  beforeEach(() => {
    service = new AegisProtocolService();
  });

  describe('health guardrails', () => {
    it('accepts a biological target at the BMI floor and velocity cap', () => {
      const heightInches = 70;
      const currentWeightLbs = (MIN_SAFE_BMI * heightInches ** 2) / 703;
      const durationDays = 35;
      const weeks = durationDays / 7;
      const targetWeightLbs =
        currentWeightLbs * (1 - MAX_WEEKLY_LOSS_VELOCITY_PCT * weeks);

      expect(
        service.validateHealthMetrics(
          {
            currentWeightLbs,
            heightInches,
            targetWeightLbs,
          },
          durationDays,
        ),
      ).toBe(true);
    });

    it('rejects a biological target below the BMI safety floor with 406', () => {
      expect(() =>
        service.validateHealthMetrics(
          {
            currentWeightLbs: 128,
            heightInches: 70,
            targetWeightLbs: 125,
          },
          30,
        ),
      ).toThrow(HttpException);

      try {
        service.validateHealthMetrics(
          {
            currentWeightLbs: 128,
            heightInches: 70,
            targetWeightLbs: 125,
          },
          30,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_ACCEPTABLE);
      }
    });

    it('rejects weekly weight-loss velocity above the shared safety cap', () => {
      const currentWeightLbs = 200;
      const durationDays = 28;
      const weeks = durationDays / 7;
      const targetWeightLbs =
        currentWeightLbs * (1 - (MAX_WEEKLY_LOSS_VELOCITY_PCT + 0.01) * weeks);

      expect(() =>
        service.validateHealthMetrics(
          {
            currentWeightLbs,
            heightInches: 70,
            targetWeightLbs,
          },
          durationDays,
        ),
      ).toThrow(/Aegis Velocity Guard/);
    });
  });

  describe('penalty multiplier windows', () => {
    it('applies a 1.5x volatility multiplier on Friday and Saturday nights', () => {
      expect(service.getVolatilityMultiplier(new Date(2026, 5, 5, 21))).toBe(1.5);
      expect(service.getVolatilityMultiplier(new Date(2026, 5, 6, 3))).toBe(1.5);
    });

    it('does not apply the volatility multiplier outside the weekend-night window', () => {
      expect(service.getVolatilityMultiplier(new Date(2026, 5, 5, 20))).toBe(1.0);
      expect(service.getVolatilityMultiplier(new Date(2026, 5, 6, 4))).toBe(1.0);
      expect(service.getVolatilityMultiplier(new Date(2026, 5, 7, 22))).toBe(1.0);
    });
  });
});
