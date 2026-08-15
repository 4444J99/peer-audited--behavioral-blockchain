import { api, setAuthToken, getAuthToken, setCsrfToken, getCsrfToken } from './api-client';

// --- fetch mock setup ---
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

function jsonOk(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
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

beforeEach(() => {
  mockFetch.mockReset();
  setAuthToken('test-token');
  setCsrfToken('');
  try {
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
      configurable: true,
    });
  } catch {
    // Node test environments may not expose document; individual tests can mock as needed.
  }
});

describe('Web API client', () => {
  describe('request()', () => {
    it('sends Authorization header with current token', async () => {
      setAuthToken('my-jwt');
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'ok' }));

      await api.health();

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers['Authorization']).toBe('Bearer my-jwt');
      expect(opts.headers['x-styx-platform']).toBe('web');
      expect(opts.headers['x-styx-app-version']).toBeDefined();
      expect(opts.headers['x-styx-build']).toBeDefined();
      expect(opts.credentials).toBe('include');
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(jsonFail(500, 'Internal Server Error'));

      await expect(api.health()).rejects.toThrow('API 500: Internal Server Error');
    });

    it('maps network failures to a product-safe unavailable message', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(api.health()).rejects.toThrow('Styx service is temporarily unavailable. Please try again shortly.');
    });
  });

  describe('token management', () => {
    it('setAuthToken / getAuthToken round-trip', () => {
      setAuthToken('tok-xyz');
      expect(getAuthToken()).toBe('tok-xyz');
    });

    it('setCsrfToken / getCsrfToken round-trip', () => {
      setCsrfToken('csrf-abc');
      expect(getCsrfToken()).toBe('csrf-abc');
    });
  });

  describe('csrf headers', () => {
    it('adds x-csrf-token on mutating requests when csrf token is set', async () => {
      setCsrfToken('csrf-live');
      mockFetch.mockResolvedValueOnce(jsonOk({ contractId: 'c1', paymentIntentId: 'pi1' }));

      await api.createContract({
        oathCategory: 'BIOLOGICAL',
        verificationMethod: 'PHOTO',
        stakeAmount: 50,
        durationDays: 30,
      } as any);

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers['x-csrf-token']).toBe('csrf-live');
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

  describe('release/bootstrap endpoints', () => {
    it('getMobileBootstrap() hits /mobile/bootstrap', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ featureFlags: {} }));

      await api.getMobileBootstrap();

      expect(mockFetch.mock.calls[0][0]).toContain('/mobile/bootstrap');
    });

    it('getReleaseInfo() hits /meta/release', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ service: 'styx-api' }));

      await api.getReleaseInfo();

      expect(mockFetch.mock.calls[0][0]).toContain('/meta/release');
    });

    it('getComplianceArtifacts() hits /compliance/artifacts', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk([]));

      await api.getComplianceArtifacts();

      expect(mockFetch.mock.calls[0][0]).toContain('/compliance/artifacts');
    });

    it('getComplianceArtifacts() returns the artifact list verbatim', async () => {
      const artifacts = [
        {
          artifactType: 'skill_contest_whitepaper',
          version: '1.0.0',
          contentHash: 'a'.repeat(64),
          signedBy: 'Outside Counsel',
          signedAt: '2026-01-01T00:00:00.000Z',
          expiresAt: null,
          isActive: true,
          jurisdictions: ['US'],
        },
      ];
      mockFetch.mockResolvedValueOnce(jsonOk(artifacts));

      await expect(api.getComplianceArtifacts()).resolves.toEqual(artifacts);
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

  describe('getEndowedProgress()', () => {
    it('reads the retention endpoint for one contract and returns its downscaling', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonOk({
          contractId: 'c1',
          realProgress: 0.75,
          endowedBoost: 0.02,
          displayProgress: 0.77,
          currentTier: 'Mastery',
          nextTierAt: 0.9,
          motivation: 'This is who you are now.',
          downscaling: { multiplier: 0.85, reason: 'weekend vulnerability in final 30%' },
        }),
      );

      const result = await api.getEndowedProgress('c1');

      expect(mockFetch.mock.calls[0][0]).toContain('/behavioral/retention/endowed-progress/c1');
      expect(result.downscaling).toEqual({
        multiplier: 0.85,
        reason: 'weekend vulnerability in final 30%',
      });
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

  describe('accountability partner endpoints', () => {
    it('getPartnerInvitations() hits the literal /contracts/invitations route', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk([]));

      await api.getPartnerInvitations();

      expect(mockFetch.mock.calls[0][0]).toContain('/contracts/invitations');
    });

    it('getPartnerships() hits /contracts/partnerships', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk([]));

      await api.getPartnerships();

      expect(mockFetch.mock.calls[0][0]).toContain('/contracts/partnerships');
    });

    it('acceptPartnerInvitation() posts to the partner-accept path', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'active' }));

      await api.acceptPartnerInvitation('c-7');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/contracts/c-7/partner/accept');
      expect(opts.method).toBe('POST');
    });

    it('respondToPartnerInvite() carries the accept flag', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ success: true, status: 'DECLINED' }));

      await api.respondToPartnerInvite('c-7', false);

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/contracts/c-7/accountability/respond');
      expect(JSON.parse(opts.body)).toEqual({ accept: false });
    });

    it('cosignAttestation() posts to the cosign path', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ status: 'cosigned' }));

      await api.cosignAttestation('c-7');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/contracts/c-7/attestation/cosign');
      expect(opts.method).toBe('POST');
    });

    it('vetoRecoveryBreak() posts to the veto path', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ success: true, message: 'vetoed' }));

      await api.vetoRecoveryBreak('c-7');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/contracts/c-7/recovery/veto-break');
      expect(opts.method).toBe('POST');
    });

    it('invitePartner() sends the invitee email', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ success: true, partnerId: 'p-1' }));

      await api.invitePartner('c-7', 'friend@styx.io');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/contracts/c-7/accountability/invite');
      expect(JSON.parse(opts.body)).toEqual({ email: 'friend@styx.io' });
    });

    it('getAccountabilityStatus() hits the status path', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ partners: [], history: [] }));

      await api.getAccountabilityStatus('c-7');

      expect(mockFetch.mock.calls[0][0]).toContain('/contracts/c-7/accountability/status');
    });

    it('getPartnerCheckIns() appends the limit only when given', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk([]));
      await api.getPartnerCheckIns('c-7');
      expect(mockFetch.mock.calls[0][0]).toContain('/behavioral/retention/partners/check-ins/c-7');
      expect(mockFetch.mock.calls[0][0]).not.toContain('limit=');

      mockFetch.mockResolvedValueOnce(jsonOk([]));
      await api.getPartnerCheckIns('c-7', 5);
      expect(mockFetch.mock.calls[1][0]).toContain('limit=5');
    });

    it('completePartnerCheckIn() sends the check-in id and message', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ id: 'chk-1' }));

      await api.completePartnerCheckIn('chk-1', 'still holding');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/behavioral/retention/partners/check-in');
      expect(JSON.parse(opts.body)).toEqual({ checkInId: 'chk-1', message: 'still holding' });
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
