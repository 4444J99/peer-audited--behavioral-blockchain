import { ApiClient, setAuthToken } from './ApiClient';

describe('registration transport contract', () => {
  const originalFetch = global.fetch;
  const base = { email: 'test@example.test', password: 'StrongExample12!', ageConfirmation: true, termsAccepted: true, dateOfBirth: '1990-01-01' };
  afterEach(() => { global.fetch = originalFetch; setAuthToken(null); });
  it.each([
    undefined,
    { platform: 'android' as const, rawVendorId: 'abc0123456789def' },
  ])('preserves the optional platform fingerprint without inventing one: %j', async (deviceFingerprint) => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ userId: 'user', token: 'test-token' }) });
    global.fetch = fetchMock;
    const data = { ...base, ...(deviceFingerprint ? { deviceFingerprint } : {}) };
    await ApiClient.register(data);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/auth/register');
    expect(JSON.parse(options.body)).toEqual(data);
  });
});
