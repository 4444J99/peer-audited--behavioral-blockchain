import { PaymentRouterService, PaymentProcessor } from './payment-router.service';

describe('PaymentRouterService', () => {
  let service: PaymentRouterService;

  beforeEach(() => {
    service = new PaymentRouterService();
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
});
