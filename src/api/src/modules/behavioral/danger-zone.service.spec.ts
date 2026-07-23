import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { DangerZoneService } from './danger-zone.service';

describe('DangerZoneService', () => {
  let service: DangerZoneService;
  let pool: { query: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DangerZoneService,
        { provide: 'DATABASE_POOL', useValue: { query: jest.fn() } },
      ],
    }).compile();

    service = module.get(DangerZoneService);
    pool = module.get('DATABASE_POOL');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('evaluateDangerWindows', () => {
    it('detects DAY_3 window when contract started 3 days ago', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T12:00:00Z'));
      const threeDaysAgo = new Date('2026-07-20T12:00:00Z');
      pool.query
        .mockResolvedValueOnce({ rows: [{ started_at: threeDaysAgo }] })
        .mockResolvedValueOnce({ rows: [{ streak: 5 }] });

      const windows = await service.evaluateDangerWindows('c-1');
      const day3 = windows.find((w) => w.type === 'DAY_3');
      expect(day3).toBeDefined();
      expect(day3!.severity).toBe('HIGH');
      expect(day3!.message).toBe('The critical first 72 hours');
    });

    it('detects DAY_21 window when contract started 21 days ago', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T12:00:00Z'));
      const twentyOneDaysAgo = new Date('2026-07-02T12:00:00Z');
      pool.query
        .mockResolvedValueOnce({ rows: [{ started_at: twentyOneDaysAgo }] })
        .mockResolvedValueOnce({ rows: [{ streak: 10 }] });

      const windows = await service.evaluateDangerWindows('c-2');
      const day21 = windows.find((w) => w.type === 'DAY_21');
      expect(day21).toBeDefined();
      expect(day21!.severity).toBe('CRITICAL');
      expect(day21!.message).toBe('The extinction burst');
    });

    it('detects WEEKEND window on a Saturday', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-25T12:00:00Z'));
      const threeDaysAgo = new Date('2026-07-22T12:00:00Z');
      pool.query
        .mockResolvedValueOnce({ rows: [{ started_at: threeDaysAgo }] })
        .mockResolvedValueOnce({ rows: [{ streak: 5 }] });

      const windows = await service.evaluateDangerWindows('c-3');
      const weekend = windows.find((w) => w.type === 'WEEKEND');
      expect(weekend).toBeDefined();
      expect(weekend!.severity).toBe('MEDIUM');
    });

    it('detects LATE_NIGHT window at 02:00 UTC', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T02:00:00Z'));
      const tenDaysAgo = new Date('2026-07-13T02:00:00Z');
      pool.query
        .mockResolvedValueOnce({ rows: [{ started_at: tenDaysAgo }] })
        .mockResolvedValueOnce({ rows: [{ streak: 5 }] });

      const windows = await service.evaluateDangerWindows('c-4');
      const lateNight = windows.find((w) => w.type === 'LATE_NIGHT');
      expect(lateNight).toBeDefined();
      expect(lateNight!.severity).toBe('HIGH');
    });

    it('returns empty array when no danger windows are active', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T12:00:00Z'));
      const tenDaysAgo = new Date('2026-07-13T12:00:00Z');
      pool.query
        .mockResolvedValueOnce({ rows: [{ started_at: tenDaysAgo }] })
        .mockResolvedValueOnce({ rows: [{ streak: 5 }] });

      const windows = await service.evaluateDangerWindows('c-5');
      expect(windows).toEqual([]);
    });

    it('detects HIGH_STREAK_RISK with 30+ attestation days', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T12:00:00Z'));
      const tenDaysAgo = new Date('2026-07-13T12:00:00Z');
      pool.query
        .mockResolvedValueOnce({ rows: [{ started_at: tenDaysAgo }] })
        .mockResolvedValueOnce({ rows: [{ streak: 30 }] });

      const windows = await service.evaluateDangerWindows('c-6');
      const streakRisk = windows.find((w) => w.type === 'HIGH_STREAK_RISK');
      expect(streakRisk).toBeDefined();
      expect(streakRisk!.severity).toBe('HIGH');
      expect(streakRisk!.message).toBe('Complacency risk from long streak');
    });
  });

  describe('getProtectionRecommendations', () => {
    it('maps DAY_3 danger to the correct recommendation', async () => {
      const recs = await service.getProtectionRecommendations([
        { type: 'DAY_3', severity: 'HIGH', message: 'test' },
      ]);
      expect(recs).toHaveLength(1);
      expect(recs[0].action).toBe('Schedule a check-in with your accountability partner');
    });

    it('maps DAY_21 danger to the correct recommendation', async () => {
      const recs = await service.getProtectionRecommendations([
        { type: 'DAY_21', severity: 'CRITICAL', message: 'test' },
      ]);
      expect(recs[0].action).toBe('Increase attestation frequency, consider reducing stakes');
    });

    it('maps WEEKEND danger to the correct recommendation', async () => {
      const recs = await service.getProtectionRecommendations([
        { type: 'WEEKEND', severity: 'MEDIUM', message: 'test' },
      ]);
      expect(recs[0].action).toBe('Pre-commit your weekend routine, avoid isolation');
    });

    it('maps LATE_NIGHT danger to the correct recommendation', async () => {
      const recs = await service.getProtectionRecommendations([
        { type: 'LATE_NIGHT', severity: 'HIGH', message: 'test' },
      ]);
      expect(recs[0].action).toBe('Enable do-not-disturb, delete tempting apps');
    });

    it('maps HIGH_STREAK_RISK danger to the correct recommendation', async () => {
      const recs = await service.getProtectionRecommendations([
        { type: 'HIGH_STREAK_RISK', severity: 'HIGH', message: 'test' },
      ]);
      expect(recs[0].action).toBe(
        'Review your original motivation, share your streak with your partner',
      );
    });

    it('returns empty array for empty input', async () => {
      const recs = await service.getProtectionRecommendations([]);
      expect(recs).toEqual([]);
    });
  });

  describe('getContractDayNumber', () => {
    it('returns correct integer for a contract started 7 days ago', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T12:00:00Z'));
      const sevenDaysAgo = new Date('2026-07-16T12:00:00Z');
      pool.query.mockResolvedValueOnce({ rows: [{ started_at: sevenDaysAgo }] });

      const days = await service.getContractDayNumber('c-7');
      expect(days).toBe(7);
    });

    it('throws when contract is not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await expect(service.getContractDayNumber('missing')).rejects.toThrow(
        'Contract missing not found',
      );
    });
  });

  describe('isInDangerZone', () => {
    it('returns true when danger windows are present', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T12:00:00Z'));
      const threeDaysAgo = new Date('2026-07-20T12:00:00Z');
      pool.query
        .mockResolvedValueOnce({ rows: [{ started_at: threeDaysAgo }] })
        .mockResolvedValueOnce({ rows: [{ streak: 5 }] });

      expect(await service.isInDangerZone('c-8')).toBe(true);
    });

    it('returns false when no danger windows are present', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T12:00:00Z'));
      const tenDaysAgo = new Date('2026-07-13T12:00:00Z');
      pool.query
        .mockResolvedValueOnce({ rows: [{ started_at: tenDaysAgo }] })
        .mockResolvedValueOnce({ rows: [{ streak: 5 }] });

      expect(await service.isInDangerZone('c-9')).toBe(false);
    });
  });
});
