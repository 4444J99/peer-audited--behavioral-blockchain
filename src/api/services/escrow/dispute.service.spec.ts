import { DisputeService } from './dispute.service';
import { StripeFboService } from './stripe.service';
import { HttpException } from '@nestjs/common';
import { Pool } from 'pg';
import { LedgerService } from '../ledger/ledger.service';
import { TruthLogService } from '../ledger/truth-log.service';

describe('DisputeService', () => {
  let disputeService: DisputeService;

  let mockStripeService: any;
  let mockPool: any;
  let mockTruthLog: any;
  let mockLedger: any;

  beforeEach(() => {
    mockStripeService = {
      holdStake: jest.fn(),
      captureStake: jest.fn(),
      refundStake: jest.fn(),
      transferBounty: jest.fn(),
    };

    mockPool = {
      query: jest.fn(),
    };

    mockTruthLog = {
      appendEvent: jest.fn(),
    };

    mockLedger = {
      recordTransaction: jest.fn(),
    };

    const stripeMock = {
      holdStake: jest.fn(),
      captureStake: jest.fn(),
      refundStake: jest.fn(),
      transferBounty: jest.fn(),
    } as unknown as StripeFboService;

    mockStripeService = stripeMock;

    disputeService = new DisputeService(
      mockPool as unknown as Pool,
      stripeMock,
      mockTruthLog as any,
      mockLedger as any,
    );
    jest.clearAllMocks();
  });

  describe('initiateAppeal', () => {
    it('should successfully initiate an appeal if the $5 fee holds', async () => {
      (mockStripeService.holdStake as jest.Mock).mockResolvedValueOnce({
        id: 'pi_test_appeal_fee',
        status: 'requires_capture',
      });

      const result = await disputeService.initiateAppeal('user-1', 'proof-1', 'cus_123');

      expect(result.appealStatus).toBe('FEE_AUTHORIZED_PENDING_REVIEW');
      expect(result.paymentIntentId).toBe('pi_test_appeal_fee');

      const holdCallArgs = (mockStripeService.holdStake as jest.Mock).mock.calls[0];
      expect(holdCallArgs[0]).toBe('cus_123');
      expect(holdCallArgs[1]).toBe(5); // Asserts the APPEAL_FEE_AMOUNT is exactly 5
    });

    it('should throw HttpException (402) if the appeal fee cannot be authorized', async () => {
      (mockStripeService.holdStake as jest.Mock).mockRejectedValueOnce(new Error('Card declined'));

      await expect(
        disputeService.initiateAppeal('user-2', 'proof-2', 'cus_456')
      ).rejects.toThrow(HttpException);

      await expect(
        disputeService.initiateAppeal('user-2', 'proof-2', 'cus_456')
      ).rejects.toThrow(/Could not authorize the \$5 appeal fee/);
    });
  });
});
