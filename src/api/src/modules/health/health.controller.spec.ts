import { HealthController } from './health.controller';
import { Pool } from 'pg';

// Mock ioredis to prevent real connections
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
  }));
});

describe('HealthController', () => {
  let controller: HealthController;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }) };
    controller = new HealthController(mockPool as unknown as Pool);
  });

  describe('check', () => {
    it('should return ok status with service name when all probes pass', async () => {
      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('styx-api');
      expect(result.checks.database.status).toBe('ok');
    });

    it('should include a valid ISO timestamp', async () => {
      const result = await controller.check();

      const parsed = new Date(result.timestamp);
      expect(parsed.getTime()).not.toBeNaN();
    });

    it('should return degraded when database probe fails', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('connection refused'));

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.checks.database.status).toBe('error');
    });

    it('should return a fresh timestamp on each call', async () => {
      const first = await controller.check();
      const second = await controller.check();

      expect(new Date(second.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(first.timestamp).getTime(),
      );
    });
  });
});
