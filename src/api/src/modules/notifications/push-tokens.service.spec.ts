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

  describe('markDelivery', () => {
    it('opens the receipt lifecycle when a ticket id was issued', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await service.markDelivery(
        'token-1', 'user-1', 'REMINDER', 'Title', 'Body', null,
        'expo', 'SENT', 'ok', undefined, 'ticket-abc',
      );

      expect(mockPool.query.mock.calls[0][0]).toContain('provider_ticket_id');
      expect(mockPool.query.mock.calls[0][1][10]).toBe('ticket-abc');
    });

    it('records no ticket when the provider did not issue one', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await service.markDelivery(
        'token-1', 'user-1', 'REMINDER', 'Title', null, null,
        'expo', 'FAILED', undefined, 'HTTP 500',
      );

      expect(mockPool.query.mock.calls[0][1][10]).toBeNull();
    });
  });

  describe('getDeliveriesAwaitingReceipt', () => {
    it('targets pending tickets past the minimum age, oldest first', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await service.getDeliveriesAwaitingReceipt(500, 300);

      const sql = mockPool.query.mock.calls[0][0];
      expect(sql).toContain("receipt_status = 'PENDING'");
      expect(sql).toContain('provider_ticket_id IS NOT NULL');
      expect(sql).toContain('ORDER BY created_at ASC');
      expect(mockPool.query.mock.calls[0][1]).toEqual([500, 300]);
    });

    it('normalizes the attempt counter pg returns as a string', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{
          id: 'd1',
          push_token_id: 't1',
          user_id: 'u1',
          provider_ticket_id: 'ticket-1',
          receipt_attempts: '4',
        }],
      });

      const pending = await service.getDeliveriesAwaitingReceipt(10, 300);

      expect(pending[0].receipt_attempts).toBe(4);
    });
  });

  describe('recordReceiptOutcome', () => {
    it('corrects the delivery status the ticket had claimed', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await service.recordReceiptOutcome(
        'd1', 'ERROR', 'UNREGISTERED', 'DeviceNotRegistered', 'gone',
      );

      expect(mockPool.query.mock.calls[0][0]).toContain('receipt_checked_at = NOW()');
      expect(mockPool.query.mock.calls[0][1]).toEqual([
        'd1', 'ERROR', 'DeviceNotRegistered', 'UNREGISTERED', 'gone',
      ]);
    });

    it('passes nulls for an OK receipt that carries no error detail', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await service.recordReceiptOutcome('d1', 'OK', 'SENT');

      expect(mockPool.query.mock.calls[0][1]).toEqual(['d1', 'OK', null, 'SENT', null]);
    });
  });

  describe('markReceiptUnresolved', () => {
    it('keeps the row pending under the ceiling', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await service.markReceiptUnresolved('d1', false);

      expect(mockPool.query.mock.calls[0][0]).toContain('receipt_attempts = receipt_attempts + 1');
      expect(mockPool.query.mock.calls[0][1]).toEqual(['d1', false]);
    });

    it('abandons the row at the ceiling', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await service.markReceiptUnresolved('d1', true);

      expect(mockPool.query.mock.calls[0][0]).toContain("'UNAVAILABLE'");
      expect(mockPool.query.mock.calls[0][1]).toEqual(['d1', true]);
    });
  });

  describe('deactivateTokenById', () => {
    it('marks the token row inactive by its primary key', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await service.deactivateTokenById('token-1');

      expect(mockPool.query.mock.calls[0][0]).toContain('UPDATE push_tokens');
      expect(mockPool.query.mock.calls[0][0]).toContain('is_active = FALSE');
      expect(mockPool.query.mock.calls[0][1]).toEqual(['token-1']);
    });
  });
});
