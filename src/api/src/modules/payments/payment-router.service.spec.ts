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

    it('should create a Stripe payment intent with mock client secret in dev', async () => {
      const result = await service.createPaymentIntent(baseOptions, 'STRIPE');
      expect(result.processor).toBe('STRIPE');
      expect(result.clientSecret).toMatch(/^pi_stripe_mock_/);
    });

    it('should create a Corepay payment intent with mock token in dev', async () => {
      const result = await service.createPaymentIntent(baseOptions, 'HIGH_RISK_COREPAY');
      expect(result.processor).toBe('HIGH_RISK_COREPAY');
      expect(result.clientSecret).toMatch(/^tok_corepay_mock_/);
    });

    it('should call Stripe and return real client secret in production for STRIPE', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const createMock = jest.fn().mockResolvedValue({ client_secret: 'pi_real_secret_123' });
      (service as any).stripe.paymentIntents.create = createMock;
      
      try {
        const result = await service.createPaymentIntent(baseOptions, 'STRIPE');
        expect(result.processor).toBe('STRIPE');
        expect(result.clientSecret).toBe('pi_real_secret_123');
        expect(createMock).toHaveBeenCalledWith({
          amount: 10000,
          currency: 'usd',
          metadata: { userId: 'user-2' },
        }, {
          idempotencyKey: 'pi-user-2-10000-usd',
        });
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should throw ServiceUnavailableException in production for COREPAY', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        await expect(service.createPaymentIntent(baseOptions, 'HIGH_RISK_COREPAY'))
          .rejects.toThrow('Corepay processor not configured for production');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
