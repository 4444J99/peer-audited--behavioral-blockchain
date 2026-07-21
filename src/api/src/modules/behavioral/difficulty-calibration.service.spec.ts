import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { DifficultyCalibrationService } from './difficulty-calibration.service';

describe('DifficultyCalibrationService', () => {
  let service: DifficultyCalibrationService;
  let pool: jest.Mocked<Pool>;

  beforeEach(async () => {
    const query = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DifficultyCalibrationService,
        { provide: Pool, useValue: { query } },
      ],
    }).compile();

    service = module.get(DifficultyCalibrationService);
    pool = module.get(Pool);
  });

  afterEach(() => {
    delete process.env.DEFAULT_USER_INCOME_CENTS;
  });

  describe('computeCalibrationWindows', () => {
    it('returns stable when completion rate is in sweet spot (80-85%)', async () => {
      pool.query.mockResolvedValue({ rows: [{ total: 100, completed: 82 }] });
      const results = await service.computeCalibrationWindows();
      const entry = results.find((r) => r.sampleSize === 100);
      expect(entry?.streak).toBe('stable');
    });

    it('returns escalate when completion rate exceeds 85%', async () => {
      pool.query.mockResolvedValue({ rows: [{ total: 50, completed: 47 }] });
      const results = await service.computeCalibrationWindows();
      const entry = results.find((r) => r.sampleSize === 50);
      expect(entry?.streak).toBe('escalate');
      expect(entry?.adjustmentCents).toBe(500);
    });

    it('returns deescalate when completion rate is below 80%', async () => {
      pool.query.mockResolvedValue({ rows: [{ total: 40, completed: 25 }] });
      const results = await service.computeCalibrationWindows();
      const entry = results.find((r) => r.sampleSize === 40);
      expect(entry?.streak).toBe('deescalate');
      expect(entry?.adjustmentCents).toBe(-500);
    });

    it('returns stable with 0 rate when sample size < 10', async () => {
      pool.query.mockResolvedValue({ rows: [{ total: 5, completed: 5 }] });
      const results = await service.computeCalibrationWindows();
      const entry = results.find((r) => r.sampleSize === 5);
      expect(entry?.streak).toBe('stable');
      expect(entry?.completionRate).toBe(0);
    });
  });

  describe('checkPatienceGuardian', () => {
    it('allows non-first contracts', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: 3 }] });
      const result = await service.checkPatienceGuardian('user_1', 100000);
      expect(result.blocked).toBe(false);
    });

    it('blocks first contract that exceeds 5% of income', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: 0 }] });
      const result = await service.checkPatienceGuardian('user_1', 50000);
      expect(result.blocked).toBe(true);
    });

    it('allows first contract within 5% of income', async () => {
      process.env.DEFAULT_USER_INCOME_CENTS = '10000000';
      pool.query.mockResolvedValue({ rows: [{ count: 0 }] });
      const result = await service.checkPatienceGuardian('user_1', 5000);
      expect(result.blocked).toBe(false);
    });
  });
});
