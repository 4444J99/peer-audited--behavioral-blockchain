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
    it('should retrieve the intent and apply the canonical 80/20 split on FAIL', async () => {
      // totalAmount = 10000 => platformFee = 8000, furyPool = 2000
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
      // single fury receives the full 2000 pool (no remainder)
      expect(mockTransfersCreate).toHaveBeenCalledWith(
        {
          amount: 2000,
          currency: 'usd',
          destination: 'fury-1',
          metadata: {
            paymentIntentId: 'pi_test_fail',
            purpose: 'FURY_BOUNTY',
          },
        },
        { idempotencyKey: 'styx_bounty_pi_test_fail_fury-1' },
      );
      expect(result).toBe(true);
    });

    it('should create Stripe transfers for each Fury on FAIL', async () => {
      // totalAmount = 20000 => platformFee = 16000, furyPool = 4000
      // bountyPerFury = floor(4000 / 2) = 2000
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_test_multi_fury', amount: 20000 });
      mockTransfersCreate.mockResolvedValue({ id: 'tr_test_multi' });

      await service.resolveEscrow('pi_test_multi_fury', 'FAIL', ['fury-A', 'fury-B']);

      expect(mockTransfersCreate).toHaveBeenCalledTimes(2);
      expect(mockTransfersCreate).toHaveBeenNthCalledWith(1,
        {
          amount: 2000,
          currency: 'usd',
          destination: 'fury-A',
          metadata: {
            paymentIntentId: 'pi_test_multi_fury',
            purpose: 'FURY_BOUNTY',
          },
        },
        { idempotencyKey: 'styx_bounty_pi_test_multi_fury_fury-A' },
      );
      expect(mockTransfersCreate).toHaveBeenNthCalledWith(2,
        {
          amount: 2000,
          currency: 'usd',
          destination: 'fury-B',
          metadata: {
            paymentIntentId: 'pi_test_multi_fury',
            purpose: 'FURY_BOUNTY',
          },
        },
        { idempotencyKey: 'styx_bounty_pi_test_multi_fury_fury-B' },
      );
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
      // furyPool = 20% of 10000 = 2000
      expect(mockTransfersCreate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 2000, destination: 'fury-1' }),
        { idempotencyKey: 'styx_bounty_pi_auth_fury-1' },
      );
    });
  });

  // ─── Fee-split math ───

  describe('fee split math', () => {
    it('should apply the canonical 80/20 split and distribute the FULL bounty pool with no cents lost to rounding', async () => {
      // totalAmount = 10000 => platformFee = 8000, furyBountyPool = 2000
      // 3 furies: base = floor(2000 / 3) = 666, remainder = 2 distributed to the first two furies
      // => 667, 667, 666 (sums to exactly 2000, no cents dropped)
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_test_math', amount: 10000 });
      mockTransfersCreate.mockResolvedValue({ id: 'tr_math' });

      await service.resolveEscrow('pi_test_math', 'FAIL', ['fury-1', 'fury-2', 'fury-3']);

      expect(mockTransfersCreate).toHaveBeenCalledTimes(3);
      const amounts = mockTransfersCreate.mock.calls.map(c => c[0].amount);
      expect(amounts).toEqual([667, 667, 666]);
      // Conservation: every cent of the bounty pool is distributed.
      expect(amounts.reduce((a, b) => a + b, 0)).toBe(2000);
    });

    it('should distribute evenly when the pool divides exactly', async () => {
      // totalAmount = 1000 => platformFee = 800, furyBountyPool = 200
      // 4 furies: 200 / 4 = 50 exactly, no remainder
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_test_floor', amount: 1000 });
      mockTransfersCreate.mockResolvedValue({ id: 'tr_floor' });

      await service.resolveEscrow('pi_test_floor', 'FAIL', ['f1', 'f2', 'f3', 'f4']);

      expect(mockTransfersCreate).toHaveBeenCalledTimes(4);
      const amounts = mockTransfersCreate.mock.calls.map(c => c[0].amount);
      expect(amounts).toEqual([50, 50, 50, 50]);
      expect(amounts.reduce((a, b) => a + b, 0)).toBe(200);
    });
  });
});
