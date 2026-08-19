import { SystemFlagsService } from './system-flags.service';
import {
  JurisdictionDispositionMapper,
  REFUND_ONLY_FLAG_KEY,
} from './jurisdiction-disposition.mapper';
import { Pool } from 'pg';

describe('SystemFlagsService', () => {
  let service: SystemFlagsService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    jest.useFakeTimers();
    mockPool = { query: jest.fn() };
    service = new SystemFlagsService(mockPool as unknown as Pool);
    JurisdictionDispositionMapper.setRefundOnlyMode(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('get', () => {
    it('reads a flag from system_flags', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ value: true }] });

      const value = await service.get<boolean>('some.flag');

      expect(value).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM system_flags'),
        ['some.flag'],
      );
    });

    it('returns null when the flag does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const value = await service.get<boolean>('missing.flag');

      expect(value).toBeNull();
    });

    it('serves repeated reads within the TTL from the in-process cache', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ value: true }] });

      await service.get<boolean>('some.flag');
      const second = await service.get<boolean>('some.flag');

      expect(second).toBe(true);
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('caches missing flags so absent keys do not hammer the database', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.get<boolean>('missing.flag');
      const second = await service.get<boolean>('missing.flag');

      expect(second).toBeNull();
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('re-reads from the database after the TTL expires', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ value: true }] })
        .mockResolvedValueOnce({ rows: [{ value: false }] });

      const first = await service.get<boolean>('some.flag');
      jest.advanceTimersByTime(5_001);
      const second = await service.get<boolean>('some.flag');

      expect(first).toBe(true);
      expect(second).toBe(false);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('propagates database errors on a cache miss', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB down'));

      await expect(service.get<boolean>('some.flag')).rejects.toThrow('DB down');
    });
  });

  describe('set', () => {
    it('upserts the flag and primes the cache', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      await service.set('some.flag', true, 'admin-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO system_flags'),
        ['some.flag', 'true', 'admin-1'],
      );
      expect(mockPool.query.mock.calls[0][0]).toContain('ON CONFLICT (key)');

      // Subsequent read is served from the primed cache — no SELECT issued.
      const value = await service.get<boolean>('some.flag');
      expect(value).toBe(true);
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('defaults updated_by to null when no actor is provided', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      await service.set('some.flag', false);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO system_flags'),
        ['some.flag', 'false', null],
      );
    });
  });

  describe('refund-only kill switch', () => {
    it('getRefundOnlyMode reads the durable flag and syncs the mapper cache', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ value: true }] });

      const enabled = await service.getRefundOnlyMode();

      expect(enabled).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM system_flags'),
        [REFUND_ONLY_FLAG_KEY],
      );
      expect(JurisdictionDispositionMapper.isRefundOnlyMode()).toBe(true);
    });

    it('getRefundOnlyMode treats a missing flag row as disabled', async () => {
      JurisdictionDispositionMapper.setRefundOnlyMode(true);
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const enabled = await service.getRefundOnlyMode();

      expect(enabled).toBe(false);
      expect(JurisdictionDispositionMapper.isRefundOnlyMode()).toBe(false);
    });

    it('getRefundOnlyMode fails CLOSED to refund-only when the store is unreachable', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB down'));

      const enabled = await service.getRefundOnlyMode();

      expect(enabled).toBe(true);
      expect(JurisdictionDispositionMapper.isRefundOnlyMode()).toBe(true);
    });

    it('setRefundOnlyMode persists the flag and syncs the mapper cache', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      await service.setRefundOnlyMode(true, 'admin-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO system_flags'),
        [REFUND_ONLY_FLAG_KEY, 'true', 'admin-1'],
      );
      expect(JurisdictionDispositionMapper.isRefundOnlyMode()).toBe(true);
    });

    it('setRefundOnlyMode does not touch the mapper cache when persistence fails', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB down'));

      await expect(service.setRefundOnlyMode(true, 'admin-1')).rejects.toThrow(
        'DB down',
      );
      expect(JurisdictionDispositionMapper.isRefundOnlyMode()).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('forces the next read back to the database', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ value: true }] })
        .mockResolvedValueOnce({ rows: [{ value: false }] });

      await service.get<boolean>('some.flag');
      service.clearCache();
      const second = await service.get<boolean>('some.flag');

      expect(second).toBe(false);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  });
});
