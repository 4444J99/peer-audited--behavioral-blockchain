import { ApiClient, setAuthToken, getAuthToken } from './ApiClient';

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
  setAuthToken(null);
});

describe('ApiClient', () => {
  // --- request() plumbing ---
  describe('request()', () => {
    it('sends Content-Type and Authorization headers', async () => {
      setAuthToken('tok-123');
      mockFetch.mockResolvedValueOnce(jsonOk({ userId: '1', token: 'x', integrity: 50 }));

      await ApiClient.login('a@b.com', 'pw');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(opts.headers['Content-Type']).toBe('application/json');
      expect(opts.headers['Authorization']).toBe('Bearer tok-123');
    });

    it('omits Authorization when no token is set', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ userId: '1', token: 'x', integrity: 50 }));

      await ApiClient.login('a@b.com', 'pw');

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers['Authorization']).toBeUndefined();
    });

    it('throws on non-ok response with status and body', async () => {
      mockFetch.mockResolvedValueOnce(jsonFail(403, 'Forbidden'));

      await expect(ApiClient.login('a@b.com', 'pw')).rejects.toThrow('API 403: Forbidden');
    });
  });

  // --- token management ---
  describe('token management', () => {
    it('setAuthToken / getAuthToken round-trip', () => {
      expect(getAuthToken()).toBeNull();
      setAuthToken('my-token');
      expect(getAuthToken()).toBe('my-token');
    });
  });

  // --- endpoint methods ---
  describe('login()', () => {
    it('sends POST to /auth/login with email and password', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ userId: 'u1', token: 't1', integrity: 50 }));

      const res = await ApiClient.login('user@styx.io', 'secret');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/login');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ email: 'user@styx.io', password: 'secret' });
      expect(res.userId).toBe('u1');
    });
  });

  describe('createContract()', () => {
    it('sends POST to /contracts with correct body', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ contractId: 'c1' }));

      const data = { category: 'BIOLOGICAL', description: 'Run daily', stakeAmount: 50, durationDays: 30 };
      await ApiClient.createContract(data);

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/contracts');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual(data);
    });
  });

  describe('getBalance()', () => {
    it('hits /wallet/balance', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ ledgerBalance: 100 }));

      await ApiClient.getBalance();

      expect(mockFetch.mock.calls[0][0]).toContain('/wallet/balance');
    });
  });

  describe('getWalletHistory()', () => {
    it('appends ?limit= when provided', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ transactions: [] }));

      await ApiClient.getWalletHistory(25);

      expect(mockFetch.mock.calls[0][0]).toContain('/wallet/history?limit=25');
    });

    it('omits limit when not provided', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ transactions: [] }));

      await ApiClient.getWalletHistory();

      expect(mockFetch.mock.calls[0][0]).toMatch(/\/wallet\/history$/);
    });
  });

  describe('changePassword()', () => {
    it('sends PATCH to /users/me/password', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'ok' }));

      await ApiClient.changePassword('old', 'new');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/users/me/password');
      expect(opts.method).toBe('PATCH');
      expect(JSON.parse(opts.body)).toEqual({ currentPassword: 'old', newPassword: 'new' });
    });
  });

  describe('updateSettings()', () => {
    it('sends PATCH to /users/me/settings', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'ok' }));

      await ApiClient.updateSettings({ emailNotifications: false });

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/users/me/settings');
      expect(opts.method).toBe('PATCH');
    });
  });

  describe('deleteAccount()', () => {
    it('sends DELETE to /users/me', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'ok' }));

      await ApiClient.deleteAccount();

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/users/me');
      expect(opts.method).toBe('DELETE');
    });
  });

  describe('submitVerdict()', () => {
    it('sends POST with assignmentId and verdict', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ success: true, bounty: 0.5 }));

      await ApiClient.submitVerdict('a1', 'VERIFY');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/fury/verdict');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ assignmentId: 'a1', verdict: 'VERIFY' });
    });
  });

  describe('exchangeEnterpriseToken()', () => {
    it('sends POST to /auth/enterprise', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ userId: 'e1', token: 'et' }));

      await ApiClient.exchangeEnterpriseToken('ent-tok');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/enterprise');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ enterpriseToken: 'ent-tok' });
    });
  });
});
