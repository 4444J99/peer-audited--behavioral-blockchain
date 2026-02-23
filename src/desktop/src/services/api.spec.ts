import { api, setToken, getToken } from './api';

// --- fetch mock setup ---
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

function jsonOk(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function jsonFail(status: number, body: string) {
  return { ok: false, status, json: async () => ({}), text: async () => body };
}

beforeEach(() => {
  mockFetch.mockReset();
  setToken('');
});

describe('Desktop API service', () => {
  describe('request()', () => {
    it('sends Content-Type and Authorization headers when token is set', async () => {
      setToken('admin-jwt');
      mockFetch.mockResolvedValueOnce(jsonOk({ totalUsers: 10 }));

      await api.getAdminStats();

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers['Content-Type']).toBe('application/json');
      expect(opts.headers['Authorization']).toBe('Bearer admin-jwt');
    });

    it('omits Authorization when token is empty', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ totalUsers: 10 }));

      await api.getAdminStats();

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers['Authorization']).toBeUndefined();
    });

    it('throws on non-ok response with status and body', async () => {
      mockFetch.mockResolvedValueOnce(jsonFail(401, 'Unauthorized'));

      await expect(api.getAdminStats()).rejects.toThrow('API 401: Unauthorized');
    });
  });

  describe('token management', () => {
    it('setToken / getToken round-trip', () => {
      expect(getToken()).toBe('');
      setToken('tok-abc');
      expect(getToken()).toBe('tok-abc');
    });
  });

  describe('login()', () => {
    it('sends POST to /auth/login with email and password', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ userId: 'a1', token: 'jwt' }));

      await api.login('admin@styx.io', 'pass');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/login');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ email: 'admin@styx.io', password: 'pass' });
    });
  });

  describe('banUser()', () => {
    it('sends POST to /admin/ban/:userId with reason', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ success: true }));

      await api.banUser('u99', 'Fraud detected');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/admin/ban/u99');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ reason: 'Fraud detected' });
    });
  });

  describe('injectHoneypot()', () => {
    it('sends POST to /admin/honeypot', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'injected', jobId: 'j1' }));

      const res = await api.injectHoneypot();

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/admin/honeypot');
      expect(opts.method).toBe('POST');
      expect(res.jobId).toBe('j1');
    });
  });

  describe('resolveContract()', () => {
    it('sends POST with outcome', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ success: true }));

      await api.resolveContract('c1', 'COMPLETED');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/admin/resolve/c1');
      expect(JSON.parse(opts.body)).toEqual({ outcome: 'COMPLETED' });
    });
  });

  describe('B2B keys', () => {
    it('getEnterpriseKeys() hits /b2b/keys', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ keys: [] }));

      await api.getEnterpriseKeys();

      expect(mockFetch.mock.calls[0][0]).toContain('/b2b/keys');
    });

    it('generateApiKey() sends POST with enterpriseId', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ key: 'k1' }));

      await api.generateApiKey('ent-1');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/b2b/keys');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ enterpriseId: 'ent-1' });
    });

    it('revokeApiKey() sends DELETE to /b2b/keys/:keyId', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ success: true }));

      await api.revokeApiKey('key-42');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/b2b/keys/key-42');
      expect(opts.method).toBe('DELETE');
    });
  });
});
