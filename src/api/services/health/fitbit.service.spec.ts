import { Pool } from 'pg';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FitbitService, FitbitReadinessState } from './fitbit.service';

describe('FitbitService', () => {
  let service: FitbitService;
  let pool: jest.Mocked<Pool>;
  let truthLog: { appendEvent: jest.Mock };

  beforeEach(() => {
    pool = { query: jest.fn() } as any;
    truthLog = { appendEvent: jest.fn().mockResolvedValue(undefined) };
    service = new FitbitService(pool, truthLog as any);
  });

  describe('processReadinessState', () => {
    const basePayload = {
      userId: 'user-1',
      contractId: 'contract-1',
      state: FitbitReadinessState.READY,
    };

    it('throws NotFoundException for missing contract', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(service.processReadinessState(basePayload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user does not own contract', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'contract-1', user_id: 'other-user', oath_category: 'RECOVERY_SLEEP', status: 'ACTIVE' }],
        rowCount: 1,
      } as any);

      await expect(service.processReadinessState(basePayload)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException for non-RECOVERY contract', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'contract-1', user_id: 'user-1', oath_category: 'SOBRIETY_ALCOHOL', status: 'ACTIVE' }],
        rowCount: 1,
      } as any);

      await expect(service.processReadinessState(basePayload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('ignores NOT_READY state', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'contract-1', user_id: 'user-1', oath_category: 'RECOVERY_SLEEP', status: 'ACTIVE' }],
        rowCount: 1,
      } as any);

      const result = await service.processReadinessState({
        ...basePayload,
        state: FitbitReadinessState.NOT_READY,
      });

      expect(result.status).toBe('ignored');
      expect(result.attestationApplied).toBe(false);
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_STATE_IGNORED',
        expect.objectContaining({ state: 'NOT_READY' }),
      );
    });

    it('credits attestation on READY state', async () => {
      pool.query
        // Contract lookup
        .mockResolvedValueOnce({
          rows: [{ id: 'contract-1', user_id: 'user-1', oath_category: 'RECOVERY_SLEEP', status: 'ACTIVE' }],
          rowCount: 1,
        } as any)
        // Check existing attestation
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        // Insert attestation
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const result = await service.processReadinessState({
        ...basePayload,
        readinessScore: 82,
        sleepScore: 75,
        restingHeartRate: 55,
        hrv: 45,
      });

      expect(result.status).toBe('recorded');
      expect(result.state).toBe('READY');
      expect(result.attestationApplied).toBe(true);
    });

    it('handles already-attested today gracefully', async () => {
      pool.query
        // Contract lookup
        .mockResolvedValueOnce({
          rows: [{ id: 'contract-1', user_id: 'user-1', oath_category: 'RECOVERY_SLEEP', status: 'ACTIVE' }],
          rowCount: 1,
        } as any)
        // Check existing attestation (already exists)
        .mockResolvedValueOnce({ rows: [{ id: 'existing-att' }], rowCount: 1 } as any);

      const result = await service.processReadinessState(basePayload);

      expect(result.status).toBe('recorded');
      expect(result.attestationApplied).toBe(false);
    });
  });

  describe('processSleepData', () => {
    it('rejects sleep outside plausible range', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'c1', user_id: 'u1', oath_category: 'RECOVERY_SLEEP', status: 'ACTIVE' }],
        rowCount: 1,
      } as any);

      const result = await service.processSleepData({
        userId: 'u1',
        contractId: 'c1',
        sleepMinutes: -30,
        sleepDate: '2026-07-23',
      });

      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('plausible range');
    });

    it('rejects when deep + REM exceeds total sleep', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'c1', user_id: 'u1', oath_category: 'RECOVERY_SLEEP', status: 'ACTIVE' }],
        rowCount: 1,
      } as any);

      const result = await service.processSleepData({
        userId: 'u1',
        contractId: 'c1',
        sleepMinutes: 360,
        sleepDate: '2026-07-23',
        deepSleepMinutes: 120,
        remSleepMinutes: 300,
      });

      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('exceeds total');
    });

    it('accepts valid sleep data', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'c1', user_id: 'u1', oath_category: 'RECOVERY_SLEEP', status: 'ACTIVE' }],
        rowCount: 1,
      } as any);

      const result = await service.processSleepData({
        userId: 'u1',
        contractId: 'c1',
        sleepMinutes: 420,
        sleepDate: '2026-07-23',
        deepSleepMinutes: 90,
        remSleepMinutes: 120,
      });

      expect(result.accepted).toBe(true);
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_SLEEP_RECEIVED',
        expect.objectContaining({ sleepMinutes: 420 }),
      );
    });
  });
});
