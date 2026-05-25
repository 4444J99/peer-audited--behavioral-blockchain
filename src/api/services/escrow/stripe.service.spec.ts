import { StripeFboService, StakeDisposition } from './stripe.service';
import { JurisdictionTier } from '../geofencing';

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
      const result = await service.holdStake('cus_test_1', 5000, 'contract-1');

      expect(result.id).toMatch(/^pi_dev_/);
      expect(result.status).toBe('requires_capture');
      expect(result.amount).toBe(5000); // 5000 cents = $50
      expect(result.currency).toBe('usd');
    });
  });

  describe('captureStake', () => {
    it('should return mock with status succeeded in dev mode', async () => {
      const result = await service.captureStake('pi_dev_abc12345');

      expect(result.id).toBe('pi_dev_abc12345');
      expect(result.status).toBe('succeeded');
    });

    // Non-dev (live Stripe) idempotency behaviour. We stub the private stripe client and
    // force isDevMode=false so the retrieve/capture branch runs.
    describe('idempotent retry (non-dev mode)', () => {
      let liveService: StripeFboService;
      let mockStripe: { paymentIntents: { retrieve: jest.Mock; capture: jest.Mock } };

      beforeEach(() => {
        liveService = new StripeFboService();
        mockStripe = {
          paymentIntents: {
            retrieve: jest.fn(),
            capture: jest.fn(),
          },
        };
        // Bypass dev-mode short-circuit and inject the mocked Stripe client.
        Object.defineProperty(liveService, 'isDevMode', { get: () => false });
        (liveService as any).stripe = mockStripe;
      });

      it('should capture when the intent is in requires_capture', async () => {
        mockStripe.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_live_1', status: 'requires_capture' });
        mockStripe.paymentIntents.capture.mockResolvedValue({ id: 'pi_live_1', status: 'succeeded' });

        const result = await liveService.captureStake('pi_live_1');

        expect(mockStripe.paymentIntents.capture).toHaveBeenCalledWith('pi_live_1', {}, expect.any(Object));
        expect(result.status).toBe('succeeded');
      });

      it('should forward a partial-capture amount', async () => {
        mockStripe.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_live_2', status: 'requires_capture' });
        mockStripe.paymentIntents.capture.mockResolvedValue({ id: 'pi_live_2', status: 'succeeded' });

        await liveService.captureStake('pi_live_2', 2500);

        expect(mockStripe.paymentIntents.capture).toHaveBeenCalledWith(
          'pi_live_2',
          { amount_to_capture: 2500 },
          expect.any(Object),
        );
      });

      it('should return success WITHOUT re-capturing when the intent already succeeded (idempotent retry)', async () => {
        // Prior attempt captured but crashed before marking the run SUCCESS; the retry must
        // not throw, so the ledger entry can be written and the job stops retrying.
        mockStripe.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_live_3', status: 'succeeded' });

        const result = await liveService.captureStake('pi_live_3');

        expect(result.id).toBe('pi_live_3');
        expect(result.status).toBe('succeeded');
        expect(mockStripe.paymentIntents.capture).not.toHaveBeenCalled();
      });

      it('should throw for a genuinely invalid state (canceled)', async () => {
        mockStripe.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_live_4', status: 'canceled' });

        await expect(liveService.captureStake('pi_live_4')).rejects.toThrow(
          /Cannot capture PaymentIntent pi_live_4.*found 'canceled'/,
        );
        expect(mockStripe.paymentIntents.capture).not.toHaveBeenCalled();
      });
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

  // Phase Beta P0-011: Refund-only disposition engine

  describe('resolveDisposition', () => {
    it('should return REFUND for completed contracts in all tiers', () => {
      expect(service.resolveDisposition('COMPLETED', JurisdictionTier.TIER_1)).toBe('REFUND');
      expect(service.resolveDisposition('COMPLETED', JurisdictionTier.TIER_2)).toBe('REFUND');
      expect(service.resolveDisposition('COMPLETED', JurisdictionTier.TIER_3)).toBe('REFUND');
    });

    it('should return CAPTURE for failed TIER_1 contracts (platform revenue)', () => {
      expect(service.resolveDisposition('FAILED', JurisdictionTier.TIER_1)).toBe('CAPTURE');
    });

    it('should return REFUND for failed TIER_2 contracts (refund-only jurisdiction)', () => {
      expect(service.resolveDisposition('FAILED', JurisdictionTier.TIER_2)).toBe('REFUND');
    });

    it('should return REFUND for failed TIER_3 contracts (safety fallback)', () => {
      expect(service.resolveDisposition('FAILED', JurisdictionTier.TIER_3)).toBe('REFUND');
    });
  });
});
