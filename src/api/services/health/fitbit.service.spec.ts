import { Pool } from 'pg';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FitbitService, FitbitReadinessState, FitbitDataProvenance } from './fitbit.service';

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
      provenance: FitbitDataProvenance.VERIFIED_WEBHOOK,
      state: FitbitReadinessState.READY,
    };

    it('rejects MANUAL provenance before touching any contract state', async () => {
      await expect(
        service.processReadinessState({
          ...basePayload,
          provenance: FitbitDataProvenance.MANUAL,
        }),
      ).rejects.toThrow(ForbiddenException);

      // The spoof attempt never reaches the database.
      expect(pool.query).not.toHaveBeenCalled();
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_UNVERIFIED_CREDIT_ATTEMPT',
        expect.objectContaining({
          contractId: 'contract-1',
          userId: 'user-1',
          provenance: FitbitDataProvenance.MANUAL,
        }),
      );
    });

    it('rejects missing provenance (legacy self-report shape)', async () => {
      await expect(
        service.processReadinessState({
          ...basePayload,
          provenance: undefined as any,
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(pool.query).not.toHaveBeenCalled();
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_UNVERIFIED_CREDIT_ATTEMPT',
        expect.objectContaining({ provenance: 'UNKNOWN' }),
      );
    });

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

    it('credits attestation on READY state from verified webhook', async () => {
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
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_READINESS_RECEIVED',
        expect.objectContaining({
          provenance: FitbitDataProvenance.VERIFIED_WEBHOOK,
          attestationApplied: true,
        }),
      );

      // The day is keyed on attestation_date (the unique key), and the row is
      // stamped with its hardware provenance so it is distinguishable later.
      const lookupSql = String((pool.query as jest.Mock).mock.calls[1][0]);
      expect(lookupSql).toContain('attestation_date = CURRENT_DATE');
      expect(lookupSql).not.toMatch(/attested_at::date/);

      const insertSql = String((pool.query as jest.Mock).mock.calls[2][0]);
      expect(insertSql).toContain(
        'INSERT INTO attestations (contract_id, user_id, attestation_date, status, attested_at, source)',
      );
      expect(insertSql).toContain("'fitbit-readiness'");
      expect(insertSql).toContain('ON CONFLICT (contract_id, attestation_date)');
      expect(insertSql).toContain('source = EXCLUDED.source');
    });

    it('upgrades a scheduler-created PENDING row instead of inserting a duplicate day', async () => {
      pool.query
        // Contract lookup
        .mockResolvedValueOnce({
          rows: [{ id: 'contract-1', user_id: 'user-1', oath_category: 'RECOVERY_SLEEP', status: 'ACTIVE' }],
          rowCount: 1,
        } as any)
        // Today's row exists but is still PENDING
        .mockResolvedValueOnce({ rows: [{ id: 'pending-att', status: 'PENDING' }], rowCount: 1 } as any)
        // Upsert
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const result = await service.processReadinessState(basePayload);

      expect(result.attestationApplied).toBe(true);
      const insertSql = String((pool.query as jest.Mock).mock.calls[2][0]);
      expect(insertSql).toContain("DO UPDATE SET status = 'ATTESTED'");
    });

    it('handles already-attested today gracefully', async () => {
      pool.query
        // Contract lookup
        .mockResolvedValueOnce({
          rows: [{ id: 'contract-1', user_id: 'user-1', oath_category: 'RECOVERY_SLEEP', status: 'ACTIVE' }],
          rowCount: 1,
        } as any)
        // Check existing attestation (already resolved today)
        .mockResolvedValueOnce({ rows: [{ id: 'existing-att', status: 'ATTESTED' }], rowCount: 1 } as any);

      const result = await service.processReadinessState(basePayload);

      expect(result.status).toBe('recorded');
      expect(result.attestationApplied).toBe(false);
      // No write was attempted — the lookup was the last query.
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('never overwrites a self-reported relapse with a wearable credit', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'contract-1', user_id: 'user-1', oath_category: 'RECOVERY_SLEEP', status: 'ACTIVE' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'relapse-att', status: 'RELAPSED' }], rowCount: 1 } as any);

      const result = await service.processReadinessState(basePayload);

      expect(result.attestationApplied).toBe(false);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('processSleepData', () => {
    const baseSleep = {
      userId: 'u1',
      contractId: 'c1',
      provenance: FitbitDataProvenance.VERIFIED_WEBHOOK,
      sleepDate: '2026-07-23',
    };

    it('rejects MANUAL provenance before touching any contract state', async () => {
      await expect(
        service.processSleepData({
          ...baseSleep,
          provenance: FitbitDataProvenance.MANUAL,
          sleepMinutes: 420,
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(pool.query).not.toHaveBeenCalled();
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_UNVERIFIED_CREDIT_ATTEMPT',
        expect.objectContaining({ contractId: 'c1', userId: 'u1' }),
      );
    });

    it('rejects sleep outside plausible range', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'c1', user_id: 'u1', oath_category: 'RECOVERY_SLEEP', status: 'ACTIVE' }],
        rowCount: 1,
      } as any);

      const result = await service.processSleepData({
        ...baseSleep,
        sleepMinutes: -30,
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
        ...baseSleep,
        sleepMinutes: 360,
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
        ...baseSleep,
        sleepMinutes: 420,
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

  describe('recordManualEntry', () => {
    it('throws NotFoundException for missing contract', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(
        service.recordManualEntry({ userId: 'u1', contractId: 'missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own contract', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'c1', user_id: 'other-user' }],
        rowCount: 1,
      } as any);

      await expect(
        service.recordManualEntry({ userId: 'u1', contractId: 'c1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('records a journal entry and NEVER credits attestations', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'c1', user_id: 'u1' }],
        rowCount: 1,
      } as any);

      const result = await service.recordManualEntry({
        userId: 'u1',
        contractId: 'c1',
        readinessScore: 99,
        sleepMinutes: 480,
        note: 'felt great',
      });

      expect(result.status).toBe('recorded');
      expect(result.provenance).toBe(FitbitDataProvenance.MANUAL);
      expect(result.attestationApplied).toBe(false);

      // The single DB round-trip is the ownership lookup — no attestation
      // SELECT/INSERT ever happens on the manual path.
      expect(pool.query).toHaveBeenCalledTimes(1);
      const issuedSql = (pool.query as jest.Mock).mock.calls
        .map((call) => String(call[0]))
        .join('\n');
      expect(issuedSql).not.toMatch(/attestations/i);

      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_MANUAL_ENTRY_RECORDED',
        expect.objectContaining({
          contractId: 'c1',
          userId: 'u1',
          provenance: FitbitDataProvenance.MANUAL,
          attestationApplied: false,
          readinessScore: 99,
          note: 'felt great',
        }),
      );
    });
  });
});
