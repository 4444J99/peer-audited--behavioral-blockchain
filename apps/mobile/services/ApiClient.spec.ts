import { ApiClient, setAuthToken, getAuthToken } from './ApiClient';

// --- fetch mock setup ---
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

function jsonOk(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function jsonFail(status: number, body: string) {
  return {
    ok: false,
    status,
    headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? 'text/plain' : null) },
    json: async () => ({}),
    text: async () => body,
  };
}

function jsonFailWithRequestId(status: number, body: unknown, requestId: string) {
  return {
    ok: false,
    status,
    headers: {
      get: (name: string) => {
        const key = name.toLowerCase();
        if (key === 'content-type') return 'application/json';
        if (key === 'x-styx-request-id') return requestId;
        return null;
      },
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
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
      expect(opts.headers['x-styx-platform']).toBe('ios');
      expect(opts.headers['x-styx-app-version']).toBeDefined();
      expect(opts.headers['x-styx-build']).toBeDefined();
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

  describe('getMobileBootstrap()', () => {
    it('hits /mobile/bootstrap', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ featureFlags: {} }));

      await ApiClient.getMobileBootstrap();

      expect(mockFetch.mock.calls[0][0]).toContain('/mobile/bootstrap');
    });
  });

  describe('getReleaseInfo()', () => {
    it('hits /meta/release', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ service: 'styx-api' }));

      await ApiClient.getReleaseInfo();

      expect(mockFetch.mock.calls[0][0]).toContain('/meta/release');
    });
  });

  describe('createContract()', () => {
    it('sends POST to /contracts with the phase-1 beta payload shape', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ contractId: 'c1' }));

      const data = {
        oathCategory: 'RECOVERY_NOCONTACT',
        verificationMethod: 'FURY_NETWORK',
        description: 'No contact for 30 days.',
        stakeAmount: 50,
        durationDays: 30,
        recoveryMetadata: {
          accountabilityPartnerEmail: 'ally@styx.io',
          noContactIdentifiers: ['Former Partner'],
          acknowledgments: {
            voluntary: true,
            noMinors: true,
            noDependents: true,
            noLegalObligations: true,
          },
        },
      };
      await ApiClient.createContract(data);

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/contracts');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual(data);
    });
  });

  describe('getContract()', () => {
    it('hits /contracts/:id and preserves the snake_case response shape', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonOk({
          id: 'c1',
          oath_category: 'RECOVERY_NOCONTACT',
          stake_amount: 50,
          grace_days_used: 1,
          grace_days_max: 3,
          proof_count: 2,
          proofs: [],
        }),
      );

      const result = await ApiClient.getContract('c1');

      expect(mockFetch.mock.calls[0][0]).toContain('/contracts/c1');
      expect(result.oath_category).toBe('RECOVERY_NOCONTACT');
      expect(result.stake_amount).toBe(50);
      expect(result.grace_days_used).toBe(1);
    });
  });

  describe('submitProof()', () => {
    it('sends POST to /contracts/:id/proof with mediaUri', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ proofId: 'p1', jobId: 'j1' }));

      const result = await ApiClient.submitProof('contract-42', { mediaUri: 'local://proof/camera/abc' });

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/contracts/contract-42/proof');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ mediaUri: 'local://proof/camera/abc' });
      expect(result.proofId).toBe('p1');
      expect(result.jobId).toBe('j1');
    });
  });

  describe('getBalance()', () => {
    it('hits /wallet/balance and preserves snake_case fields', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ ledger_balance: 100 }));

      const result = await ApiClient.getBalance();

      expect(mockFetch.mock.calls[0][0]).toContain('/wallet/balance');
      expect(result.ledger_balance).toBe(100);
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

  describe('attestation endpoints', () => {
    it('gets attestation status from the recovery endpoint', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonOk({
          contract_id: 'c1',
          oath_category: 'RECOVERY_NOCONTACT',
          streak_days: 7,
          days_remaining: 23,
          grace_days_available: 2,
          today_attested: false,
          total_strikes: 1,
        }),
      );

      const result = await ApiClient.getAttestationStatus('c1');

      expect(mockFetch.mock.calls[0][0]).toContain('/contracts/c1/attestation');
      expect(result.streak_days).toBe(7);
      expect(result.today_attested).toBe(false);
    });

    it('submits attestation to the recovery endpoint', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'ok' }));

      await ApiClient.submitAttestation('c1');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/contracts/c1/attestation');
      expect(opts.method).toBe('POST');
    });
  });

  describe('error parsing', () => {
    it('appends support trace IDs from response headers', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonFailWithRequestId(
          409,
          { message: 'Already attested today', error_code: 'ATT_DUPLICATE' },
          'req-att-409',
        ),
      );

      await expect(ApiClient.submitAttestation('c1')).rejects.toThrow(
        'API 409: Already attested today (ATT_DUPLICATE) [request_id: req-att-409]',
      );
    });
  });
});
