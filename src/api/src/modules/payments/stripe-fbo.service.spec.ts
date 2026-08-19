import { StripeFBOService } from './stripe-fbo.service';
import Stripe from 'stripe';

// Mock the Stripe constructor and its methods
jest.mock('stripe');

const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>;

describe('StripeFBOService', () => {
  let service: StripeFBOService;
  let mockPaymentIntentsCreate: jest.Mock;
  let mockPaymentIntentsRetrieve: jest.Mock;
  let mockPaymentIntentsCapture: jest.Mock;
  let mockPaymentIntentsCancel: jest.Mock;
  let mockRefundsCreate: jest.Mock;
  let mockTransfersCreate: jest.Mock;

  beforeEach(() => {
    mockPaymentIntentsCreate = jest.fn();
    mockPaymentIntentsRetrieve = jest.fn();
    mockPaymentIntentsCapture = jest.fn().mockResolvedValue({ id: 'pi_captured', status: 'succeeded' });
    mockPaymentIntentsCancel = jest.fn().mockResolvedValue({ id: 'pi_cancelled', status: 'canceled' });
    mockRefundsCreate = jest.fn();
    mockTransfersCreate = jest.fn();

    MockedStripe.mockImplementation(() => ({
      paymentIntents: {
        create: mockPaymentIntentsCreate,
        retrieve: mockPaymentIntentsRetrieve,
        capture: mockPaymentIntentsCapture,
        cancel: mockPaymentIntentsCancel,
      },
      refunds: {
        create: mockRefundsCreate,
      },
      transfers: {
        create: mockTransfersCreate,
      },
    }) as any);

    service = new StripeFBOService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── lockStakeInEscrow ───

  describe('lockStakeInEscrow', () => {
    it('should create a PaymentIntent with correct amount, USD currency, metadata, manual capture, and an idempotency key (PM3)', async () => {
      const mockIntentId = 'pi_test_abc123';
      mockPaymentIntentsCreate.mockResolvedValue({ id: mockIntentId });

      await service.lockStakeInEscrow('user-1', 5000, 'contract-42');

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        {
          amount: 5000,
          currency: 'usd',
          metadata: {
            userId: 'user-1',
            contractId: 'contract-42',
            purpose: 'BEHAVIORAL_STAKE_ESCROW',
          },
          capture_method: 'manual',
        },
        { idempotencyKey: 'styx_lock_contract-42' },
      );
    });

    it('should return the PaymentIntent ID', async () => {
      const mockIntentId = 'pi_test_return_id_456';
      mockPaymentIntentsCreate.mockResolvedValue({ id: mockIntentId });

      const result = await service.lockStakeInEscrow('user-2', 10000, 'contract-99');

      expect(result).toBe(mockIntentId);
    });
  });

  // ─── resolveEscrow — PASS ───

  describe('resolveEscrow (PASS)', () => {
    it('should release the manual hold (cancel) with an idempotency key on PASS (PM3)', async () => {
      const result = await service.resolveEscrow('pi_test_pass', 'PASS');

      expect(mockPaymentIntentsCancel).toHaveBeenCalledWith(
        'pi_test_pass',
        { cancellation_reason: 'requested_by_customer' },
        { idempotencyKey: 'styx_release_pi_test_pass' },
      );
      expect(result).toBe(true);
    });

    it('should not retrieve the intent, capture, or create transfers on PASS', async () => {
      await service.resolveEscrow('pi_test_pass_no_retrieve', 'PASS');

      expect(mockPaymentIntentsRetrieve).not.toHaveBeenCalled();
      expect(mockPaymentIntentsCapture).not.toHaveBeenCalled();
      expect(mockTransfersCreate).not.toHaveBeenCalled();
    });
  });

  // ─── resolveEscrow — FAIL ───

  describe('resolveEscrow (FAIL)', () => {
    it('should retrieve the intent and capture the whole stake on FAIL', async () => {
      // DR-002: totalAmount = 10000 => platformFee = 10000, furyPool = 0
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_test_fail', amount: 10000 });
      mockTransfersCreate.mockResolvedValue({ id: 'tr_test_001' });

      const result = await service.resolveEscrow('pi_test_fail', 'FAIL', ['fury-1']);

      expect(mockPaymentIntentsRetrieve).toHaveBeenCalledWith('pi_test_fail');
      // PM1: the held stake must actually be captured (slashed), not just logged.
      expect(mockPaymentIntentsCapture).toHaveBeenCalledWith(
        'pi_test_fail',
        { amount_to_capture: 10000 },
        { idempotencyKey: 'styx_capture_pi_test_fail_10000' },
      );
      expect(result).toBe(true);
    });

    it('should pay no Fury bounty, even with Furies present (DR-002)', async () => {
      // The forfeited deposit is not redistributed. A zero-amount Stripe transfer is also
      // invalid, so this must skip the call entirely rather than send 0.
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_test_multi_fury', amount: 20000 });
      mockTransfersCreate.mockResolvedValue({ id: 'tr_test_multi' });

      await service.resolveEscrow('pi_test_multi_fury', 'FAIL', ['fury-A', 'fury-B']);

      expect(mockPaymentIntentsCapture).toHaveBeenCalledWith(
        'pi_test_multi_fury',
        { amount_to_capture: 20000 },
        { idempotencyKey: 'styx_capture_pi_test_multi_fury_20000' },
      );
      expect(mockTransfersCreate).not.toHaveBeenCalled();
    });

    it('should not create any transfers when there are no Furies on FAIL', async () => {
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_test_no_fury', amount: 5000 });

      const result = await service.resolveEscrow('pi_test_no_fury', 'FAIL', []);

      expect(mockTransfersCreate).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should also skip transfers when furies argument is omitted on FAIL', async () => {
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_test_default_furies', amount: 5000 });

      const result = await service.resolveEscrow('pi_test_default_furies', 'FAIL');

      expect(mockTransfersCreate).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should reject a non-USD PaymentIntent rather than slashing it as USD (PM2)', async () => {
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_eur', amount: 10000, currency: 'eur' });

      await expect(service.resolveEscrow('pi_eur', 'FAIL', ['fury-1'])).rejects.toThrow(/only 'usd' is supported/);
      expect(mockPaymentIntentsCapture).not.toHaveBeenCalled();
      expect(mockTransfersCreate).not.toHaveBeenCalled();
    });

    it('should use the server-authoritative contract stake over the live PI amount when supplied (PM2)', async () => {
      // Live PI says 99999 but the server-authoritative stake is 10000; the split MUST use 10000.
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_auth', amount: 99999, currency: 'usd' });
      mockTransfersCreate.mockResolvedValue({ id: 'tr_auth' });

      await service.resolveEscrow('pi_auth', 'FAIL', ['fury-1'], 10000);

      expect(mockPaymentIntentsCapture).toHaveBeenCalledWith(
        'pi_auth',
        { amount_to_capture: 10000 },
        { idempotencyKey: 'styx_capture_pi_auth_10000' },
      );
    });
  });

  // ─── Fee-split math ───
  //
  // The per-Fury remainder distribution moved to `distributeBountyPool` in
  // settlement-quote.ts and is tested there. Driving it through resolveEscrow is no longer
  // possible: under DR-002 the pool is 0, so the split is unobservable from this service.
  // What IS still worth asserting here is that the whole stake reaches the platform.

  describe('fee split math', () => {
    it('should capture the entire forfeited stake to the platform (DR-002)', async () => {
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_test_math', amount: 10000 });
      mockTransfersCreate.mockResolvedValue({ id: 'tr_math' });

      await service.resolveEscrow('pi_test_math', 'FAIL', ['fury-1', 'fury-2', 'fury-3']);

      expect(mockPaymentIntentsCapture).toHaveBeenCalledWith(
        'pi_test_math',
        { amount_to_capture: 10000 },
        { idempotencyKey: 'styx_capture_pi_test_math_10000' },
      );
      expect(mockTransfersCreate).not.toHaveBeenCalled();
    });
  });
});
