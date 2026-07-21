import { ExpoPushProvider } from './expo-push.provider';

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
});
