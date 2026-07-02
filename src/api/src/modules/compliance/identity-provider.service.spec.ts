import {
  MockIdentityProviderAdapter,
  StripeIdentityProviderAdapter,
  IdentityProviderService,
  StartIdentityVerificationInput,
} from './identity-provider.service';

describe('MockIdentityProviderAdapter', () => {
  let adapter: MockIdentityProviderAdapter;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.STYX_WEB_PUBLIC_URL;
    delete process.env.NEXT_PUBLIC_WEB_URL;
    adapter = new MockIdentityProviderAdapter();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should have providerName MOCK', () => {
    expect(adapter.providerName).toBe('MOCK');
  });

  it('should return a pending verification with a mock ID', async () => {
    const result = await adapter.start({
      userId: 'user-1',
      email: '[email redacted]',
      mode: 'KYC_ONLY',
      returnUrl: 'http://localhost:3001',
    });

    expect(result.provider).toBe('MOCK');
    expect(result.verificationId).toMatch(/^ivs_mock_/);
    expect(result.status).toBe('PENDING');
    expect(result.hostedUrl).toContain('mockIdentity=1');
    expect(result.clientSecret).toBe(null);
  });

  it('should use returnUrl in the hosted URL', async () => {
    const result = await adapter.start({
      userId: 'user-1',
      mode: 'KYC_ONLY',
      returnUrl: 'https://app.styx.io',
    });

    expect(result.hostedUrl).toContain('https://app.styx.io');
  });

  it('should use configured web URL when no returnUrl provided', async () => {
    process.env.STYX_WEB_PUBLIC_URL = 'https://configured.styx.test';

    const result = await adapter.start({
      userId: 'user-1',
      mode: 'KYC_ONLY',
    });

    expect(result.hostedUrl).toContain('https://configured.styx.test');
  });

  it('should reject missing web URL when no returnUrl provided', async () => {
    await expect(
      adapter.start({
        userId: 'user-1',
        mode: 'KYC_ONLY',
      }),
    ).rejects.toThrow(/Web public URL is required/);
  });

  it('should generate unique verification IDs', async () => {
    const input = { mode: 'KYC_ONLY' as const, returnUrl: 'https://app.styx.test' };
    const result1 = await adapter.start({ ...input, userId: 'u1' });
    const result2 = await adapter.start({ ...input, userId: 'u2' });
    expect(result1.verificationId).not.toBe(result2.verificationId);
  });
});

describe('StripeIdentityProviderAdapter', () => {
  let adapter: StripeIdentityProviderAdapter;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.STRIPE_SECRET_KEY;
    adapter = new StripeIdentityProviderAdapter();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should have providerName STRIPE_IDENTITY', () => {
    expect(adapter.providerName).toBe('STRIPE_IDENTITY');
  });

  it('should report isAvailable=false when no real key is set', () => {
    expect(adapter.isAvailable).toBe(false);
  });

  it('should report isAvailable=false for default mock key', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
    const fresh = new StripeIdentityProviderAdapter();
    expect(fresh.isAvailable).toBe(false);
  });

  it('should hard-fail construction in production with a mock/unset key (PRV13)', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.STRIPE_SECRET_KEY; // -> defaults to mock key
    expect(() => new StripeIdentityProviderAdapter()).toThrow(/real key in production/i);

    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
    expect(() => new StripeIdentityProviderAdapter()).toThrow(/real key in production/i);
  });

  it('should throw when start() called without a real key', async () => {
    await expect(
      adapter.start({ userId: 'u1', mode: 'KYC_ONLY' }),
    ).rejects.toThrow('Stripe Identity provider is not configured');
  });

  describe('parseWebhookEvent', () => {
    it('should return null for non-identity events', () => {
      expect(adapter.parseWebhookEvent({ type: 'payment_intent.succeeded' })).toBe(null);
    });

    it('should return null for missing object id', () => {
      expect(adapter.parseWebhookEvent({
        type: 'identity.verification_session.verified',
        data: { object: {} },
      })).toBe(null);
    });

    it('should parse verified event correctly', () => {
      const result = adapter.parseWebhookEvent({
        type: 'identity.verification_session.verified',
        data: {
          object: {
            id: 'vs_abc123',
            metadata: { styxUserId: 'user-1', verificationMode: 'KYC_ONLY' },
          },
        },
      });

      expect(result).not.toBe(null);
      expect(result!.provider).toBe('STRIPE_IDENTITY');
      expect(result!.verificationId).toBe('vs_abc123');
      expect(result!.status).toBe('VERIFIED');
      expect(result!.mode).toBe('KYC_ONLY');
      expect(result!.userId).toBe('user-1');
    });

    it('should parse requires_input event as FAILED', () => {
      const result = adapter.parseWebhookEvent({
        type: 'identity.verification_session.requires_input',
        data: { object: { id: 'vs_fail', metadata: {} } },
      });

      expect(result!.status).toBe('FAILED');
    });

    it('should parse canceled event as REJECTED', () => {
      const result = adapter.parseWebhookEvent({
        type: 'identity.verification_session.canceled',
        data: { object: { id: 'vs_cancel', metadata: {} } },
      });

      expect(result!.status).toBe('REJECTED');
    });

    it('should default mode to KYC_AND_AGE when not in metadata', () => {
      const result = adapter.parseWebhookEvent({
        type: 'identity.verification_session.verified',
        data: { object: { id: 'vs_no_mode', metadata: {} } },
      });

      expect(result!.mode).toBe('KYC_AND_AGE');
    });

    it('should return null userId when not in metadata', () => {
      const result = adapter.parseWebhookEvent({
        type: 'identity.verification_session.verified',
        data: { object: { id: 'vs_no_user', metadata: {} } },
      });

      expect(result!.userId).toBe(null);
    });
  });
});

describe('IdentityProviderService', () => {
  let service: IdentityProviderService;
  let mockMockAdapter: jest.Mocked<MockIdentityProviderAdapter>;
  let mockStripeAdapter: jest.Mocked<StripeIdentityProviderAdapter>;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.STYX_IDENTITY_PROVIDER;
    mockMockAdapter = {
      providerName: 'MOCK',
      start: jest.fn(),
    } as any;
    mockStripeAdapter = {
      providerName: 'STRIPE_IDENTITY',
      start: jest.fn(),
      parseWebhookEvent: jest.fn(),
      constructVerifiedEvent: jest.fn(),
    } as any;
    delete process.env.NODE_ENV;
    service = new IdentityProviderService(mockMockAdapter, mockStripeAdapter);
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('startVerification', () => {
    const input: StartIdentityVerificationInput = {
      userId: 'user-1',
      email: '[email redacted]',
      mode: 'KYC_ONLY',
    };

    it('should use mock adapter by default', async () => {
      mockMockAdapter.start.mockResolvedValue({
        provider: 'MOCK',
        verificationId: 'ivs_mock_abc',
        status: 'PENDING',
        hostedUrl: 'http://localhost',
        clientSecret: null,
      });

      const result = await service.startVerification(input);
      expect(result.provider).toBe('MOCK');
      expect(mockMockAdapter.start).toHaveBeenCalled();
      expect(mockStripeAdapter.start).not.toHaveBeenCalled();
    });

    it('should use Stripe adapter when STYX_IDENTITY_PROVIDER=STRIPE', async () => {
      process.env.STYX_IDENTITY_PROVIDER = 'STRIPE';
      service = new IdentityProviderService(mockMockAdapter, mockStripeAdapter);

      mockStripeAdapter.start.mockResolvedValue({
        provider: 'STRIPE_IDENTITY',
        verificationId: 'vs_abc',
        status: 'PENDING',
        hostedUrl: 'https://verify.stripe.com',
        clientSecret: 'cs_abc',
      });

      const result = await service.startVerification(input);
      expect(result.provider).toBe('STRIPE_IDENTITY');
      expect(mockStripeAdapter.start).toHaveBeenCalled();
    });

    it('should fall back to mock when Stripe adapter throws in non-production', async () => {
      process.env.STYX_IDENTITY_PROVIDER = 'STRIPE_IDENTITY';
      delete process.env.NODE_ENV;
      service = new IdentityProviderService(mockMockAdapter, mockStripeAdapter);

      mockStripeAdapter.start.mockRejectedValue(new Error('Stripe not configured'));
      mockMockAdapter.start.mockResolvedValue({
        provider: 'MOCK',
        verificationId: 'ivs_mock_fallback',
        status: 'PENDING',
        hostedUrl: 'http://localhost',
        clientSecret: null,
      });

      const result = await service.startVerification(input);
      expect(result.provider).toBe('MOCK');
    });

    it('should NOT fall back to mock when Stripe adapter throws in production', async () => {
      process.env.STYX_IDENTITY_PROVIDER = 'STRIPE_IDENTITY';
      process.env.NODE_ENV = 'production';
      service = new IdentityProviderService(mockMockAdapter, mockStripeAdapter);

      mockStripeAdapter.start.mockRejectedValue(new Error('Stripe outage'));

      await expect(service.startVerification(input)).rejects.toThrow('Stripe outage');
      expect(mockMockAdapter.start).not.toHaveBeenCalled();
    });

    it('should refuse the mock provider in production when no provider is explicitly configured', async () => {
      delete process.env.STYX_IDENTITY_PROVIDER;
      process.env.NODE_ENV = 'production';
      service = new IdentityProviderService(mockMockAdapter, mockStripeAdapter);

      // Production defaults to the real provider; the stripe adapter (unconfigured) throws.
      mockStripeAdapter.start.mockRejectedValue(new Error('Stripe Identity provider is not configured'));

      await expect(service.startVerification(input)).rejects.toThrow();
      expect(mockMockAdapter.start).not.toHaveBeenCalled();
    });

    it('should refuse mock when STYX_IDENTITY_PROVIDER=MOCK is forced in production', async () => {
      process.env.STYX_IDENTITY_PROVIDER = 'MOCK';
      process.env.NODE_ENV = 'production';
      service = new IdentityProviderService(mockMockAdapter, mockStripeAdapter);

      await expect(service.startVerification(input)).rejects.toThrow(/Mock identity provider is disabled/);
      expect(mockMockAdapter.start).not.toHaveBeenCalled();
    });
  });

  describe('parseStripeIdentityWebhook (disabled - PRV12)', () => {
    it('should hard-throw instead of parsing an unverified payload', () => {
      // The legacy signature-less parser is neutralized; only the signature-verified
      // path (verifyAndParseStripeWebhook) is reachable.
      expect(() =>
        service.parseStripeIdentityWebhook({ type: 'identity.verification_session.verified' }),
      ).toThrow(/disabled \(PRV12\)/);
      // It must never delegate to the adapter's unverified parse.
      expect(mockStripeAdapter.parseWebhookEvent).not.toHaveBeenCalled();
    });
  });

  describe('verifyAndParseStripeWebhook', () => {
    it('should verify the signature then parse the resulting event', () => {
      const verifiedEvent = { type: 'identity.verification_session.verified', data: { object: { id: 'vs_1' } } };
      (mockStripeAdapter.constructVerifiedEvent as jest.Mock).mockReturnValue(verifiedEvent);
      mockStripeAdapter.parseWebhookEvent.mockReturnValue({
        provider: 'STRIPE_IDENTITY',
        verificationId: 'vs_1',
        mode: 'KYC_ONLY',
        status: 'VERIFIED',
        userId: 'user-1',
      });

      const result = service.verifyAndParseStripeWebhook(Buffer.from('{}'), 't=1,v1=abc');
      expect(mockStripeAdapter.constructVerifiedEvent).toHaveBeenCalledWith(expect.any(Buffer), 't=1,v1=abc');
      expect(mockStripeAdapter.parseWebhookEvent).toHaveBeenCalledWith(verifiedEvent);
      expect(result?.userId).toBe('user-1');
    });

    it('should propagate verification errors (forged / unsigned events rejected)', () => {
      (mockStripeAdapter.constructVerifiedEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Missing Stripe-Signature header');
      });

      expect(() => service.verifyAndParseStripeWebhook(Buffer.from('{}'), undefined)).toThrow(
        'Missing Stripe-Signature header',
      );
      expect(mockStripeAdapter.parseWebhookEvent).not.toHaveBeenCalled();
    });
  });
});
