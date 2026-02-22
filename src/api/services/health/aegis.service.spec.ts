import { AegisProtocolService } from './aegis.service';
import { HttpException } from '@nestjs/common';

describe('AegisProtocolService', () => {
  let service: AegisProtocolService;

  beforeEach(() => {
    service = new AegisProtocolService();
  });

  describe('validateHealthMetrics', () => {
    it('should pass for a medically safe weight loss metric (BMI > 18.5, Loss < 2%)', () => {
      // 180 lbs, 70 inches (5'10") -> BMI ~ 25.8
      // Wants to lose 2 lbs in 7 days (1 week) -> ~ 1.1% velocity
      const isValid = service.validateHealthMetrics(180, 70, 178, 7);
      expect(isValid).toBe(true);
    });

    it('should throw HttpException (406) if current BMI is too low (< 18.5)', () => {
      // 110 lbs, 67 inches (5'7") -> BMI ~ 17.2 (Anorexia/Underweight risk)
      expect(() => {
        service.validateHealthMetrics(110, 67, 108, 14);
      }).toThrow(HttpException);
      expect(() => {
        service.validateHealthMetrics(110, 67, 108, 14);
      }).toThrow(/Current BMI .* strictly below the safe floor/);
    });

    it('should throw HttpException (406) if proposed loss velocity is dangerously high (> 2%/week)', () => {
      // 200 lbs, 70 inches -> BMI ~ 28.7
      // Wants to lose 10 lbs in 7 days -> 5% velocity per week (Starvation risk)
      expect(() => {
        service.validateHealthMetrics(200, 70, 190, 7);
      }).toThrow(HttpException);
      expect(() => {
        service.validateHealthMetrics(200, 70, 190, 7);
      }).toThrow(/Proposed weight loss velocity .* strictly exceeds the safe maximum/);
    });

    it('should pass if the user is not trying to lose weight (e.g. maintaining or bulking)', () => {
      // 150 lbs, 70 inches -> BMI 21.5
      // Target is 155 lbs (Muscle gain)
      const isValid = service.validateHealthMetrics(150, 70, 155, 30);
      expect(isValid).toBe(true);
    });
  });
});
