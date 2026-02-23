import { StripeFboService } from './stripe.service';

describe('StripeFboService (dev mode)', () => {
  let service: StripeFboService;
  const originalEnv = process.env.STRIPE_SECRET_KEY;

  beforeAll(() => {
    // Force dev mode by setting the mock key
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
  });

  afterAll(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.STRIPE_SECRET_KEY = originalEnv;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
  });

  beforeEach(() => {
    service = new StripeFboService();
  });

  describe('holdStake', () => {
    it('should return mock PaymentIntent in dev mode', async () => {
      const result = await service.holdStake('cus_test_1', 50, 'contract-1');

      expect(result.id).toMatch(/^pi_dev_/);
      expect(result.status).toBe('requires_capture');
      expect(result.amount).toBe(5000); // $50 * 100 cents
      expect(result.currency).toBe('usd');
    });
  });

  describe('captureStake', () => {
    it('should return mock with status succeeded in dev mode', async () => {
      const result = await service.captureStake('pi_dev_abc12345');

      expect(result.id).toBe('pi_dev_abc12345');
      expect(result.status).toBe('succeeded');
    });
  });

  describe('cancelHold', () => {
    it('should return mock with status canceled in dev mode', async () => {
      const result = await service.cancelHold('pi_dev_abc12345');

      expect(result.id).toBe('pi_dev_abc12345');
      expect(result.status).toBe('canceled');
    });
  });

  describe('createCustomer', () => {
    it('should return mock customer ID in dev mode', async () => {
      const customerId = await service.createCustomer('user-1', 'user@styx.app');

      expect(customerId).toMatch(/^cus_dev_/);
      expect(typeof customerId).toBe('string');
    });
  });
});
