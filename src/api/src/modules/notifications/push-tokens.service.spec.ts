import { PushTokensService } from './push-tokens.service';

describe('PushTokensService', () => {
  let service: PushTokensService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new PushTokensService(mockPool as any);
  });

  describe('registerToken', () => {
    it('deactivates existing token then upserts', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await service.registerToken('user-1', 'tok-1', 'ios', 'dev-123');

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      // First call: deactivate existing
      expect(mockPool.query.mock.calls[0][0]).toContain('UPDATE push_tokens');
      expect(mockPool.query.mock.calls[0][0]).toContain('is_active = FALSE');
      // Second call: upsert
      expect(mockPool.query.mock.calls[1][0]).toContain('INSERT INTO push_tokens');
      expect(mockPool.query.mock.calls[1][0]).toContain('ON CONFLICT');
    });

    it('handles null deviceIdentifier', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await service.registerToken('user-1', 'tok-2', 'android');

      expect(mockPool.query.mock.calls[1][1]).toContain(null);
    });
  });

  describe('unregisterToken', () => {
    it('marks token inactive', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await service.unregisterToken('user-1', 'tok-1');

      expect(mockPool.query.mock.calls[0][0]).toContain('is_active = FALSE');
      expect(mockPool.query.mock.calls[0][1]).toEqual(['user-1', 'tok-1']);
    });
  });

  describe('getActiveTokens', () => {
    it('returns active tokens ordered by last_seen', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          { id: 't1', token: 'tok-1', platform: 'ios' },
          { id: 't2', token: 'tok-2', platform: 'android' },
        ],
      });

      const tokens = await service.getActiveTokens('user-1');

      expect(tokens).toHaveLength(2);
      expect(tokens[0].token).toBe('tok-1');
    });

    it('returns empty array when no tokens', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const tokens = await service.getActiveTokens('user-1');

      expect(tokens).toEqual([]);
    });
  });
});
