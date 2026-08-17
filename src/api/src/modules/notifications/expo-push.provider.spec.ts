import { ExpoPushProvider, EXPO_RECEIPT_BATCH_SIZE } from './expo-push.provider';

describe('ExpoPushProvider', () => {
  let provider: ExpoPushProvider;

  beforeEach(() => {
    provider = new ExpoPushProvider();
  });

  describe('send', () => {
    const originalEnv = process.env.EXPO_ACCESS_TOKEN;

    afterEach(() => {
      process.env.EXPO_ACCESS_TOKEN = originalEnv;
    });

    it('returns dev fallback when EXPO_ACCESS_TOKEN is not set', async () => {
      delete process.env.EXPO_ACCESS_TOKEN;

      const result = await provider.send({
        token: 'ExponentPushToken[xxx]',
        title: 'Test',
        body: 'Hello',
      });

      expect(result.status).toBe('SENT');
      expect(result.providerResult).toBe('dev-fallback');
    });

    it('handles Expo API success response', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ status: 'ok' }] }),
      });

      const result = await provider.send({
        token: 'ExponentPushToken[xxx]',
        title: 'Test',
      });

      expect(result.status).toBe('SENT');
      expect(result.providerResult).toBe('ok');
    });

    it('returns the ticket id so the receipt sweep can resolve the send', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ status: 'ok', id: 'ticket-abc' }] }),
      });

      const result = await provider.send({
        token: 'ExponentPushToken[xxx]', // allow-secret
        title: 'Test',
      });

      expect(result.ticketId).toBe('ticket-abc');
    });

    it('classifies MessageRateExceeded as FAILED, not UNREGISTERED', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{
            status: 'error',
            message: 'Rate limited',
            details: { error: 'MessageRateExceeded' },
          }],
        }),
      });

      const result = await provider.send({
        token: 'ExponentPushToken[xxx]', // allow-secret
        title: 'Test',
      });

      // A rate limit is about this attempt; the device is still reachable.
      expect(result.status).toBe('FAILED');
    });

    it('reads DeviceNotRegistered from the structured details code', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{
            status: 'error',
            message: 'gone',
            details: { error: 'DeviceNotRegistered' },
          }],
        }),
      });

      const result = await provider.send({
        token: 'ExponentPushToken[dead]', // allow-secret
        title: 'Test',
      });

      expect(result.status).toBe('UNREGISTERED');
    });

    it('handles Expo API error (DeviceNotRegistered)', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ status: 'error', message: '"DeviceNotRegistered"' }],
        }),
      });

      const result = await provider.send({
        token: 'ExponentPushToken[dead]',
        title: 'Test',
      });

      expect(result.status).toBe('UNREGISTERED');
    });

    it('handles network failure', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await provider.send({
        token: 'ExponentPushToken[xxx]',
        title: 'Test',
      });

      expect(result.status).toBe('FAILED');
      expect(result.errorMessage).toBe('ECONNREFUSED');
    });

    it('handles non-ok HTTP response', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Too Many Requests',
      });

      const result = await provider.send({
        token: 'ExponentPushToken[xxx]',
        title: 'Test',
      });

      expect(result.status).toBe('FAILED');
    });
  });

  describe('fetchReceipts', () => {
    const originalEnv = process.env.EXPO_ACCESS_TOKEN;

    afterEach(() => {
      process.env.EXPO_ACCESS_TOKEN = originalEnv;
    });

    it('returns an empty map without calling the API for no ticket ids', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn();

      const receipts = await provider.fetchReceipts([]);

      expect(receipts.size).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns an empty map when EXPO_ACCESS_TOKEN is not set', async () => {
      delete process.env.EXPO_ACCESS_TOKEN;
      global.fetch = jest.fn();

      const receipts = await provider.fetchReceipts(['ticket-1']);

      expect(receipts.size).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('maps ok receipts to OK', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { 'ticket-1': { status: 'ok' } } }),
      });

      const receipts = await provider.fetchReceipts(['ticket-1']);

      expect(receipts.get('ticket-1')).toEqual({ status: 'OK' });
    });

    it('surfaces the machine-readable error code from an error receipt', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            'ticket-1': {
              status: 'error',
              message: 'The device is not registered.',
              details: { error: 'DeviceNotRegistered' },
            },
          },
        }),
      });

      const receipts = await provider.fetchReceipts(['ticket-1']);

      expect(receipts.get('ticket-1')).toEqual({
        status: 'ERROR',
        errorCode: 'DeviceNotRegistered',
        errorMessage: 'The device is not registered.',
      });
    });

    it('omits tickets Expo has not resolved yet', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { 'ticket-1': { status: 'ok' } } }),
      });

      const receipts = await provider.fetchReceipts(['ticket-1', 'ticket-2']);

      expect(receipts.has('ticket-1')).toBe(true);
      expect(receipts.has('ticket-2')).toBe(false);
    });

    it('returns no verdicts on a non-ok HTTP response', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => 'Bad Gateway',
      });

      const receipts = await provider.fetchReceipts(['ticket-1']);

      expect(receipts.size).toBe(0);
    });

    it('returns no verdicts when the request throws', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('ECONNRESET'));

      const receipts = await provider.fetchReceipts(['ticket-1']);

      expect(receipts.size).toBe(0);
    });

    it('splits oversized id lists into batched requests', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      const ids = Array.from({ length: EXPO_RECEIPT_BATCH_SIZE + 5 }, (_, i) => `ticket-${i}`);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await provider.fetchReceipts(ids);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      const firstBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      const secondBody = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
      expect(firstBody.ids).toHaveLength(EXPO_RECEIPT_BATCH_SIZE);
      expect(secondBody.ids).toHaveLength(5);
    });

    it('still returns the resolved verdicts when the response also carries request errors', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { 'ticket-1': { status: 'ok' } },
          errors: [{ code: 'PUSH_TOO_MANY_EXPERIENCE_IDS', message: 'too many' }],
        }),
      });

      const receipts = await provider.fetchReceipts(['ticket-1']);

      expect(receipts.get('ticket-1')).toEqual({ status: 'OK' });
    });
  });
});
