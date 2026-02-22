import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  describe('check', () => {
    it('should return ok status with service name', () => {
      const result = controller.check();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('styx-api');
    });

    it('should include a valid ISO timestamp', () => {
      const result = controller.check();

      const parsed = new Date(result.timestamp);
      expect(parsed.getTime()).not.toBeNaN();
    });

    it('should return a fresh timestamp on each call', () => {
      const first = controller.check();
      const second = controller.check();

      // Timestamps should be equal or increasing (same millisecond is fine)
      expect(new Date(second.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(first.timestamp).getTime(),
      );
    });
  });
});
