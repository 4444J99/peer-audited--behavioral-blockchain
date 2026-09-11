import { PaymentRouterService, PaymentProcessor } from './payment-router.service';

describe('PaymentRouterService', () => {
  let service: PaymentRouterService;

  beforeEach(() => {
    const mockStripe = { releaseFunds: jest.fn().mockResolvedValue({ status: 'COMPLETED', externalRef: 'pi_mock_1' }) };
    const mockCorepay = { releaseFunds: jest.fn().mockResolvedValue({ status: 'COMPLETED', externalRef: 'tok_mock_1' }) };
    service = new PaymentRouterService(
      mockStripe as any,
      mockCorepay as any,
    );
  });

  // ─── determineProcessor ───

  describe('determineProcessor', () => {
    const baseOptions = {
      amount: 5000,
      currency: 'usd',
      userId: 'user-1',
    };

    it('should route to STRIPE for normal user with no disputes', () => {
      const result = service.determineProcessor(baseOptions, 0);
      expect(result).toBe('STRIPE');
    });

    it('should route to STRIPE when disputes are below threshold', () => {
      const result = service.determineProcessor(baseOptions, 2);
      expect(result).toBe('STRIPE');
    });

    it('should route to HIGH_RISK_COREPAY when disputes reach threshold (3)', () => {
      const result = service.determineProcessor(baseOptions, 3);
      expect(result).toBe('HIGH_RISK_COREPAY');
    });

    it('should route to HIGH_RISK_COREPAY when disputes exceed threshold', () => {
      const result = service.determineProcessor(baseOptions, 10);
      expect(result).toBe('HIGH_RISK_COREPAY');
    });

    it('should route to HIGH_RISK_COREPAY when isHighRisk flag is set', () => {
      const result = service.determineProcessor({ ...baseOptions, isHighRisk: true }, 0);
      expect(result).toBe('HIGH_RISK_COREPAY');
    });

    it('should prioritize isHighRisk flag over low dispute count', () => {
      const result = service.determineProcessor({ ...baseOptions, isHighRisk: true }, 0);
      expect(result).toBe('HIGH_RISK_COREPAY');
    });

    it('should handle isHighRisk=false with zero disputes as STRIPE', () => {
      const result = service.determineProcessor({ ...baseOptions, isHighRisk: false }, 0);
      expect(result).toBe('STRIPE');
    });
  });

  // ─── createPaymentIntent ───

  describe('createPaymentIntent', () => {
    const baseOptions = {
      amount: 10000,
      currency: 'usd',
      userId: 'user-2',
    };

    const savedEnv = process.env.NODE_ENV;
    afterEach(() => {
      if (savedEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = savedEnv;
      }
    });

    it('should create a Stripe payment intent with mock client secret in development', async () => {
      process.env.NODE_ENV = 'development';
      const result = await service.createPaymentIntent(baseOptions, 'STRIPE');
      expect(result.processor).toBe('STRIPE');
      expect(result.clientSecret).toMatch(/^pi_stripe_mock_/);
    });

    it('should create a Corepay payment intent with mock token in development', async () => {
      process.env.NODE_ENV = 'development';
      const result = await service.createPaymentIntent(baseOptions, 'HIGH_RISK_COREPAY');
      expect(result.processor).toBe('HIGH_RISK_COREPAY');
      expect(result.clientSecret).toMatch(/^tok_corepay_mock_/);
    });

    it('should create a mock client secret in the test environment', async () => {
      process.env.NODE_ENV = 'test';
      const result = await service.createPaymentIntent(baseOptions, 'STRIPE');
      expect(result.clientSecret).toMatch(/^pi_stripe_mock_/);
    });

    it('should throw in production when STRIPE_SECRET_KEY is missing', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.STRIPE_SECRET_KEY;
      await expect(service.createPaymentIntent(baseOptions, 'STRIPE'))
        .rejects.toThrow();
    });

    it('should throw ServiceUnavailableException in staging', async () => {
      process.env.NODE_ENV = 'staging';
      await expect(service.createPaymentIntent(baseOptions, 'STRIPE'))
        .rejects.toThrow();
    });

    it('should fail closed when NODE_ENV is unset', async () => {
      delete process.env.NODE_ENV;
      await expect(service.createPaymentIntent(baseOptions, 'STRIPE'))
        .rejects.toThrow();
    });

    it('should throw for COREPAY in production', async () => {
      process.env.NODE_ENV = 'production';
      await expect(service.createPaymentIntent(baseOptions, 'HIGH_RISK_COREPAY'))
        .rejects.toThrow();
    });
  });

  // ─── determineGeographicRoute (Issue #85) ───

  describe('determineGeographicRoute', () => {
    const baseOptions = {
      amount: 5000,
      currency: 'usd',
      userId: 'user-geo-1',
    };

    it('routes permitted US state (CA) to STRIPE with TIER_1 and standard fee', () => {
      const route = service.determineGeographicRoute(baseOptions, { country: 'US', state: 'CA' }, 0);
      expect(route.processor).toBe('STRIPE');
      expect(route.jurisdictionTier).toBe('FULL_ACCESS');
      expect(route.refundOnly).toBe(false);
      expect(route.scaRequired).toBe(false);
      expect(route.feeStructure.percentageFee).toBe(2.9);
      expect(route.feeStructure.fixedFeeCents).toBe(30);
    });

    it('routes restricted US state (NY) to STRIPE with TIER_2 and refund-only enabled', () => {
      const route = service.determineGeographicRoute(baseOptions, { country: 'US', state: 'NY' }, 0);
      expect(route.processor).toBe('STRIPE');
      expect(route.jurisdictionTier).toBe('REFUND_ONLY');
      expect(route.refundOnly).toBe(true);
      expect(route.reason).toContain('refund-only');
    });

    it('blocks payments from hard-blocked US state (WA)', () => {
      expect(() => {
        service.determineGeographicRoute(baseOptions, { country: 'US', state: 'WA' }, 0);
      }).toThrow('TIER_3 Hard Block');
    });

    it('blocks payments from unlisted / unknown US state (fail-closed default)', () => {
      expect(() => {
        service.determineGeographicRoute(baseOptions, { country: 'US', state: 'ZZ' }, 0);
      }).toThrow('TIER_3 Hard Block');
    });

    it('routes European jurisdiction (DE) with SCA requirement and EEA fees', () => {
      const route = service.determineGeographicRoute(
        { ...baseOptions, currency: 'eur' },
        { country: 'DE' },
        0,
      );
      expect(route.processor).toBe('STRIPE');
      expect(route.scaRequired).toBe(true);
      expect(route.feeStructure.percentageFee).toBe(1.4);
      expect(route.feeStructure.fixedFeeCents).toBe(25);
    });

    it('routes high-risk or excessive dispute user to HIGH_RISK_COREPAY', () => {
      const route = service.determineGeographicRoute(
        baseOptions,
        { country: 'US', state: 'CA' },
        4,
      );
      expect(route.processor).toBe('HIGH_RISK_COREPAY');
      expect(route.fallbackProcessor).toBe('STRIPE');
      expect(route.feeStructure.percentageFee).toBe(7.5);
    });

    it('routes stablecoin rail or USDC currency to STABLECOIN_VAULT', () => {
      const route = service.determineGeographicRoute(
        { ...baseOptions, currency: 'usdc' },
        { country: 'US', state: 'CA', preferredRail: 'CRYPTO' },
        0,
      );
      expect(route.processor).toBe('STABLECOIN_VAULT');
      expect(route.feeStructure.percentageFee).toBe(0.5);
    });

    it('tracks routing metrics across jurisdictions', () => {
      service.determineGeographicRoute(baseOptions, { country: 'US', state: 'CA' }, 0);
      expect(() => {
        service.determineGeographicRoute(baseOptions, { country: 'US', state: 'WA' }, 0);
      }).toThrow();
      const metrics = service.getRoutingMetrics();
      expect(metrics.totalDecisions).toBe(2);
      expect(metrics.routedStripe).toBe(1);
      expect(metrics.blockedJurisdictions).toBe(1);
    });
  });
});
