import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  EndowedProgressService,
  ProgressTier,
} from './endowed-progress.service';

describe('EndowedProgressService', () => {
  let service: EndowedProgressService;
  let pool: { query: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EndowedProgressService,
        { provide: 'DATABASE_POOL', useValue: { query: jest.fn() } },
      ],
    }).compile();

    service = module.get(EndowedProgressService);
    pool = module.get('DATABASE_POOL');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getProgressState', () => {
    it('shows endowed boost for a new contract at day 0', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T12:00:00Z'));
      const now = new Date('2026-07-23T12:00:00Z');

      pool.query.mockResolvedValueOnce({
        rows: [{ duration_days: 90, started_at: now.toISOString() }],
        rowCount: 1,
      });

      const state = await service.getProgressState('contract-1');
      expect(state.realProgress).toBe(0);
      expect(state.endowedBoost).toBeGreaterThan(0);
      expect(state.displayProgress).toBe(0.12);
      expect(state.currentTier).toBe('Awakening');
    });

    it('calculates mid-contract progress correctly', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T12:00:00Z'));
      const startedAt = new Date('2026-07-01T12:00:00Z');

      pool.query.mockResolvedValueOnce({
        rows: [{ duration_days: 90, started_at: startedAt.toISOString() }],
        rowCount: 1,
      });

      const state = await service.getProgressState('contract-2');
      expect(state.realProgress).toBeCloseTo(22 / 90, 5);
      expect(state.currentTier).toBe('Commitment');
    });

    it('caps display progress at 1.0 for a completed contract', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T12:00:00Z'));
      const startedAt = new Date('2026-04-24T12:00:00Z');

      pool.query.mockResolvedValueOnce({
        rows: [{ duration_days: 90, started_at: startedAt.toISOString() }],
        rowCount: 1,
      });

      const state = await service.getProgressState('contract-3');
      expect(state.realProgress).toBeGreaterThanOrEqual(1);
      expect(state.displayProgress).toBe(1);
    });

    it('throws NotFoundException for missing contract', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(service.getProgressState('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCurrentTier', () => {
    it('returns Awakening at 0%', () => {
      expect(service.getCurrentTier(0).name).toBe('Awakening');
    });

    it('returns Commitment at 0.15', () => {
      expect(service.getCurrentTier(0.15).name).toBe('Commitment');
    });

    it('returns Momentum at 0.30', () => {
      expect(service.getCurrentTier(0.30).name).toBe('Momentum');
    });

    it('returns Resilience at 0.50', () => {
      expect(service.getCurrentTier(0.50).name).toBe('Resilience');
    });

    it('returns Mastery at 0.70', () => {
      expect(service.getCurrentTier(0.70).name).toBe('Mastery');
    });

    it('returns Transcendence at 0.90', () => {
      expect(service.getCurrentTier(0.90).name).toBe('Transcendence');
    });

    it('returns Transcendence at 1.0', () => {
      expect(service.getCurrentTier(1.0).name).toBe('Transcendence');
    });

    it('returns tier between thresholds', () => {
      expect(service.getCurrentTier(0.4).name).toBe('Momentum');
      expect(service.getCurrentTier(0.6).name).toBe('Resilience');
      expect(service.getCurrentTier(0.8).name).toBe('Mastery');
    });
  });

  describe('getNextTierProgress', () => {
    it('returns Commitment as next tier from Awakening', () => {
      const next = service.getNextTierProgress(0);
      expect(next.nextTier).toBe('Commitment');
      expect(next.at).toBe(0.15);
    });

    it('returns Momentum as next tier from Commitment', () => {
      const next = service.getNextTierProgress(0.15);
      expect(next.nextTier).toBe('Momentum');
      expect(next.at).toBe(0.30);
    });

    it('returns Complete at 1.0', () => {
      const next = service.getNextTierProgress(1.0);
      expect(next.nextTier).toBe('Complete');
      expect(next.at).toBe(1.0);
    });
  });

  describe('getMotivationMessage', () => {
    it('returns the tier message', () => {
      const tier: ProgressTier = {
        name: 'Test',
        threshold: 0,
        message: 'Test message',
        boost: 0,
      };
      expect(service.getMotivationMessage(tier)).toBe('Test message');
    });
  });

  describe('applyDynamicDownscaling', () => {
    it('returns multiplier 1.0 with no strikes on a weekday', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T12:00:00Z'));
      const startedAt = new Date('2026-07-01T12:00:00Z');

      pool.query.mockResolvedValueOnce({
        rows: [{ strikes: 0, duration_days: 90, started_at: startedAt.toISOString() }],
        rowCount: 1,
      });

      const result = await service.applyDynamicDownscaling('contract-1');
      expect(result.multiplier).toBe(1.0);
      expect(result.reason).toBe('no downscaling applied');
    });

    it('reduces multiplier for strikes', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-23T12:00:00Z'));
      const startedAt = new Date('2026-07-01T12:00:00Z');

      pool.query.mockResolvedValueOnce({
        rows: [{ strikes: 2, duration_days: 90, started_at: startedAt.toISOString() }],
        rowCount: 1,
      });

      const result = await service.applyDynamicDownscaling('contract-2');
      expect(result.multiplier).toBeLessThan(1.0);
      expect(result.reason).toContain('prior violation');
    });

    it('applies weekend downscaling in final 30%', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-25T12:00:00Z'));
      const startedAt = new Date('2026-04-24T12:00:00Z');

      pool.query.mockResolvedValueOnce({
        rows: [{ strikes: 0, duration_days: 90, started_at: startedAt.toISOString() }],
        rowCount: 1,
      });

      const result = await service.applyDynamicDownscaling('contract-3');
      expect(result.multiplier).toBe(0.85);
      expect(result.reason).toContain('weekend vulnerability');
    });

    it('does not apply weekend downscaling before final 30%', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-25T12:00:00Z'));
      const startedAt = new Date('2026-07-01T12:00:00Z');

      pool.query.mockResolvedValueOnce({
        rows: [{ strikes: 0, duration_days: 90, started_at: startedAt.toISOString() }],
        rowCount: 1,
      });

      const result = await service.applyDynamicDownscaling('contract-4');
      expect(result.multiplier).toBe(1.0);
    });

    it('throws NotFoundException for missing contract', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        service.applyDynamicDownscaling('missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
