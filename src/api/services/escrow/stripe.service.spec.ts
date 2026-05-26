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

    it('should surface the partial-capture amount in dev mode (PM18)', async () => {
      const result: any = await service.captureStake('pi_dev_partial', 2500);

      expect(result.status).toBe('succeeded');
      expect(result.amount_received).toBe(2500);
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

        // PM17: full-capture key carries the `_full` suffix.
        expect(mockStripe.paymentIntents.capture).toHaveBeenCalledWith(
          'pi_live_1',
          {},
          { idempotencyKey: 'styx_capture_pi_live_1_full' },
        );
        expect(result.status).toBe('succeeded');
      });

      it('should forward a partial-capture amount and key the idempotency on the amount (PM17)', async () => {
        mockStripe.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_live_2', status: 'requires_capture' });
        mockStripe.paymentIntents.capture.mockResolvedValue({ id: 'pi_live_2', status: 'succeeded' });

        await liveService.captureStake('pi_live_2', 2500);

        expect(mockStripe.paymentIntents.capture).toHaveBeenCalledWith(
          'pi_live_2',
          { amount_to_capture: 2500 },
          { idempotencyKey: 'styx_capture_pi_live_2_2500' },
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

  describe('transferFunds (PM7 idempotency)', () => {
    let liveService: StripeFboService;
    let mockStripe: { transfers: { create: jest.Mock } };

    beforeEach(() => {
      liveService = new StripeFboService();
      mockStripe = { transfers: { create: jest.fn().mockResolvedValue({ id: 'tr_live_1', amount: 1000 }) } };
      Object.defineProperty(liveService, 'isDevMode', { get: () => false });
      (liveService as any).stripe = mockStripe;
    });

    it('should attach a deterministic idempotency key derived from a stable metadata id', async () => {
      await liveService.transferFunds(1000, 'acct_dest_1', { sideEffectKey: 'evt-123' });

      expect(mockStripe.transfers.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 1000, destination: 'acct_dest_1', currency: 'usd' }),
        { idempotencyKey: 'styx_transfer_acct_dest_1_evt-123' },
      );
    });

    it('should honor an explicit idempotency key argument', async () => {
      await liveService.transferFunds(500, 'acct_dest_2', undefined, 'explicit-key');

      expect(mockStripe.transfers.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 500, destination: 'acct_dest_2' }),
        { idempotencyKey: 'styx_transfer_acct_dest_2_explicit-key' },
      );
    });

    it('should fall back to destination+amount when no stable id is available', async () => {
      await liveService.transferFunds(750, 'acct_dest_3');

      expect(mockStripe.transfers.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 750, destination: 'acct_dest_3' }),
        { idempotencyKey: 'styx_transfer_acct_dest_3_750' },
      );
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
