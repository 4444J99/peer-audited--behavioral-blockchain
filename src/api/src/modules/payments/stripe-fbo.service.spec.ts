import { StripeFBOService } from './stripe-fbo.service';
import Stripe from 'stripe';

// Mock the Stripe constructor and its methods
jest.mock('stripe');

const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>;

describe('StripeFBOService', () => {
  let service: StripeFBOService;
  let mockPaymentIntentsCreate: jest.Mock;
  let mockPaymentIntentsRetrieve: jest.Mock;
  let mockRefundsCreate: jest.Mock;
  let mockTransfersCreate: jest.Mock;

  beforeEach(() => {
    mockPaymentIntentsCreate = jest.fn();
    mockPaymentIntentsRetrieve = jest.fn();
    mockRefundsCreate = jest.fn();
    mockTransfersCreate = jest.fn();

    MockedStripe.mockImplementation(() => ({
      paymentIntents: {
        create: mockPaymentIntentsCreate,
        retrieve: mockPaymentIntentsRetrieve,
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
    it('should create a PaymentIntent with correct amount, USD currency, metadata, and automatic capture', async () => {
      const mockIntentId = 'pi_test_abc123';
      mockPaymentIntentsCreate.mockResolvedValue({ id: mockIntentId });

      await service.lockStakeInEscrow('user-1', 5000, 'contract-42');

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'usd',
        metadata: {
          userId: 'user-1',
          contractId: 'contract-42',
          purpose: 'BEHAVIORAL_STAKE_ESCROW',
        },
        capture_method: 'automatic',
      });
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
    it('should create a refund with requested_by_customer reason on PASS', async () => {
      mockRefundsCreate.mockResolvedValue({ id: 're_test_001' });

      const result = await service.resolveEscrow('pi_test_pass', 'PASS');

      expect(mockRefundsCreate).toHaveBeenCalledWith({
        payment_intent: 'pi_test_pass',
        reason: 'requested_by_customer',
      });
      expect(result).toBe(true);
    });

    it('should not retrieve the intent or create transfers on PASS', async () => {
      mockRefundsCreate.mockResolvedValue({ id: 're_test_002' });

      await service.resolveEscrow('pi_test_pass_no_retrieve', 'PASS');

      expect(mockPaymentIntentsRetrieve).not.toHaveBeenCalled();
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
      // bountyPerFury = floor(2000 / 1) = 2000
      expect(mockTransfersCreate).toHaveBeenCalledWith({
        amount: 2000,
        currency: 'usd',
        destination: 'fury-1',
        metadata: {
          paymentIntentId: 'pi_test_fail',
          purpose: 'FURY_BOUNTY',
        },
      });
      expect(result).toBe(true);
    });

    it('should create Stripe transfers for each Fury on FAIL', async () => {
      // totalAmount = 20000 => platformFee = 16000, furyPool = 4000
      // bountyPerFury = floor(4000 / 2) = 2000
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_test_multi_fury', amount: 20000 });
      mockTransfersCreate.mockResolvedValue({ id: 'tr_test_multi' });

      await service.resolveEscrow('pi_test_multi_fury', 'FAIL', ['fury-A', 'fury-B']);

      expect(mockTransfersCreate).toHaveBeenCalledTimes(2);
      expect(mockTransfersCreate).toHaveBeenNthCalledWith(1, {
        amount: 2000,
        currency: 'usd',
        destination: 'fury-A',
        metadata: {
          paymentIntentId: 'pi_test_multi_fury',
          purpose: 'FURY_BOUNTY',
        },
      });
      expect(mockTransfersCreate).toHaveBeenNthCalledWith(2, {
        amount: 2000,
        currency: 'usd',
        destination: 'fury-B',
        metadata: {
          paymentIntentId: 'pi_test_multi_fury',
          purpose: 'FURY_BOUNTY',
        },
      });
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
  });

  // ─── Fee-split math ───

  describe('fee split math', () => {
    it('should apply the canonical 80/20 split and distribute the bounty pool across Furies using floor division', async () => {
      // totalAmount = 10000
      // platformFee = 8000
      // furyBountyPool = 2000
      // bountyPerFury (3 furies) = floor(2000 / 3) = 666
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_test_math', amount: 10000 });
      mockTransfersCreate.mockResolvedValue({ id: 'tr_math' });

      await service.resolveEscrow('pi_test_math', 'FAIL', ['fury-1', 'fury-2', 'fury-3']);

      expect(mockTransfersCreate).toHaveBeenCalledTimes(3);
      const firstCallArgs = mockTransfersCreate.mock.calls[0][0];
      expect(firstCallArgs.amount).toBe(666); // floor(2000 / 3)
    });

    it('should compute bountyPerFury as floor of furyPool divided by number of Furies', async () => {
      // totalAmount = 1000
      // platformFee = 800
      // furyBountyPool = 200
      // bountyPerFury (4 furies) = floor(200 / 4) = 50
      mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_test_floor', amount: 1000 });
      mockTransfersCreate.mockResolvedValue({ id: 'tr_floor' });

      await service.resolveEscrow('pi_test_floor', 'FAIL', ['f1', 'f2', 'f3', 'f4']);

      expect(mockTransfersCreate).toHaveBeenCalledTimes(4);
      const callAmount = mockTransfersCreate.mock.calls[0][0].amount;
      expect(callAmount).toBe(50); // floor(200 / 4)
    });
  });
});
