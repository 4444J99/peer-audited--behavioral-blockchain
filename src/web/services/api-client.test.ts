import { api, setAuthToken, getAuthToken } from './api-client';

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
  setAuthToken('test-token');
});

describe('Web API client', () => {
  describe('request()', () => {
    it('sends Authorization header with current token', async () => {
      setAuthToken('my-jwt');
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'ok' }));

      await api.health();

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers['Authorization']).toBe('Bearer my-jwt');
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(jsonFail(500, 'Internal Server Error'));

      await expect(api.health()).rejects.toThrow('API 500: Internal Server Error');
    });
  });

  describe('token management', () => {
    it('setAuthToken / getAuthToken round-trip', () => {
      setAuthToken('tok-xyz');
      expect(getAuthToken()).toBe('tok-xyz');
    });
  });

  describe('login()', () => {
    it('sends POST with email and password', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ userId: 'u1', token: 'jwt' }));

      await api.login('user@styx.io', 'secret');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/login');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ email: 'user@styx.io', password: 'secret' });
    });
  });

  describe('register()', () => {
    it('sends POST with email and password', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ userId: 'u2', token: 'jwt2' }));

      await api.register('new@styx.io', 'pw123');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/register');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ email: 'new@styx.io', password: 'pw123' });
    });
  });

  describe('getBalance()', () => {
    it('hits /wallet/balance', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ ledgerBalance: 100 }));

      await api.getBalance();

      expect(mockFetch.mock.calls[0][0]).toContain('/wallet/balance');
    });
  });

  describe('createContract()', () => {
    it('sends correct DTO', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ contractId: 'c1', paymentIntentId: 'pi1' }));

      const dto = { oathCategory: 'BIOLOGICAL', verificationMethod: 'PHOTO', stakeAmount: 50, durationDays: 30 };
      await api.createContract(dto);

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/contracts');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual(dto);
    });
  });

  describe('submitProof()', () => {
    it('sends to correct contract path', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ proofId: 'p1', jobId: 'j1' }));

      await api.submitProof('c-42', { mediaUri: 'https://r2.styx/proof.mp4' });

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/contracts/c-42/proof');
      expect(opts.method).toBe('POST');
    });
  });

  describe('getFuryAssignments()', () => {
    it('hits /fury/queue', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ assignments: [] }));

      await api.getFuryAssignments();

      expect(mockFetch.mock.calls[0][0]).toContain('/fury/queue');
    });
  });

  describe('submitVerdict()', () => {
    it('sends correct body', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'recorded' }));

      await api.submitVerdict({ assignmentId: 'a1', verdict: 'PASS' });

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/fury/verdict');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ assignmentId: 'a1', verdict: 'PASS' });
    });
  });

  describe('getMe()', () => {
    it('hits /users/me', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ id: 'u1', email: 'x@y.com' }));

      await api.getMe();

      expect(mockFetch.mock.calls[0][0]).toContain('/users/me');
    });
  });

  describe('changePassword()', () => {
    it('sends PATCH with correct body', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'ok' }));

      await api.changePassword('old', 'new');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/users/me/password');
      expect(opts.method).toBe('PATCH');
      expect(JSON.parse(opts.body)).toEqual({ currentPassword: 'old', newPassword: 'new' });
    });
  });

  describe('updateSettings()', () => {
    it('sends PATCH with correct body', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'ok' }));

      await api.updateSettings({ emailNotifications: true, pushNotifications: false });

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/users/me/settings');
      expect(opts.method).toBe('PATCH');
    });
  });

  describe('deleteAccount()', () => {
    it('sends DELETE to /users/me', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'ok' }));

      await api.deleteAccount();

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/users/me');
      expect(opts.method).toBe('DELETE');
    });
  });

  describe('grillMe()', () => {
    it('sends POST to /ai/grill-me', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ questions: ['What is your TAM?'] }));

      await api.grillMe('Slide 1: TAM is $5B');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/ai/grill-me');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ slideContent: 'Slide 1: TAM is $5B' });
    });
  });
});
