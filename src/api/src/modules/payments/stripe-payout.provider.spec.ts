import { StripePayoutProvider } from './stripe-payout.provider';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { PayoutStatus } from '../../common/interfaces/payout-provider.interface';

describe('StripePayoutProvider', () => {
  let provider: StripePayoutProvider;
  let mockStripeService: {
    cancelHold: jest.Mock;
    captureStake: jest.Mock;
    retrieveIntent: jest.Mock;
  };

  beforeEach(() => {
    mockStripeService = {
      cancelHold: jest.fn(),
      captureStake: jest.fn(),
      retrieveIntent: jest.fn(),
    };

    provider = new StripePayoutProvider(mockStripeService as unknown as StripeFboService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── releaseFunds ───

  describe('releaseFunds', () => {
    it('should call cancelHold and return SUCCESS with the intent ID on success', async () => {
      const mockIntent = { id: 'pi_release_001', status: 'canceled' };
      mockStripeService.cancelHold.mockResolvedValue(mockIntent);

      const result = await provider.releaseFunds('pi_release_001', 5000);

      expect(mockStripeService.cancelHold).toHaveBeenCalledWith('pi_release_001');
      expect(result.status).toBe(PayoutStatus.SUCCESS);
      expect(result.providerTransactionId).toBe('pi_release_001');
      expect(result.rawResponse).toEqual(mockIntent);
    });

    it('should return FAILED with error message when cancelHold throws', async () => {
      mockStripeService.cancelHold.mockRejectedValue(new Error('Stripe network error'));

      const result = await provider.releaseFunds('pi_release_fail', 5000);

      expect(result.status).toBe(PayoutStatus.FAILED);
      expect(result.error).toBe('Stripe network error');
      expect(result.providerTransactionId).toBeUndefined();
    });
  });

  // ─── captureFunds ───

  describe('captureFunds', () => {
    it('should call captureStake and return SUCCESS with the intent ID on success', async () => {
      const mockIntent = { id: 'pi_capture_001', status: 'succeeded' };
      mockStripeService.captureStake.mockResolvedValue(mockIntent);

      const result = await provider.captureFunds('pi_capture_001', 10000);

      expect(mockStripeService.captureStake).toHaveBeenCalledWith('pi_capture_001');
      expect(result.status).toBe(PayoutStatus.SUCCESS);
      expect(result.providerTransactionId).toBe('pi_capture_001');
      expect(result.rawResponse).toEqual(mockIntent);
    });

    it('should return FAILED with error message when captureStake throws', async () => {
      mockStripeService.captureStake.mockRejectedValue(new Error('Card declined'));

      const result = await provider.captureFunds('pi_capture_fail', 10000);

      expect(result.status).toBe(PayoutStatus.FAILED);
      expect(result.error).toBe('Card declined');
      expect(result.providerTransactionId).toBeUndefined();
    });
  });

  // ─── getTransactionStatus ───

  describe('getTransactionStatus', () => {
    it('should map "succeeded" intent status to PayoutStatus.SUCCESS', async () => {
      mockStripeService.retrieveIntent.mockResolvedValue({ id: 'pi_status_001', status: 'succeeded' });

      const status = await provider.getTransactionStatus('pi_status_001');

      expect(mockStripeService.retrieveIntent).toHaveBeenCalledWith('pi_status_001');
      expect(status).toBe(PayoutStatus.SUCCESS);
    });

    it('should map "canceled" intent status to PayoutStatus.SUCCESS', async () => {
      mockStripeService.retrieveIntent.mockResolvedValue({ id: 'pi_status_002', status: 'canceled' });

      const status = await provider.getTransactionStatus('pi_status_002');

      expect(status).toBe(PayoutStatus.SUCCESS);
    });

    it('should map "requires_capture" intent status to PayoutStatus.PENDING', async () => {
      mockStripeService.retrieveIntent.mockResolvedValue({ id: 'pi_status_003', status: 'requires_capture' });

      const status = await provider.getTransactionStatus('pi_status_003');

      expect(status).toBe(PayoutStatus.PENDING);
    });

    it('should map "processing" intent status to PayoutStatus.PENDING', async () => {
      mockStripeService.retrieveIntent.mockResolvedValue({ id: 'pi_status_004', status: 'processing' });

      const status = await provider.getTransactionStatus('pi_status_004');

      expect(status).toBe(PayoutStatus.PENDING);
    });

    it('should map "requires_payment_method" intent status to PayoutStatus.PENDING', async () => {
      mockStripeService.retrieveIntent.mockResolvedValue({ id: 'pi_status_005', status: 'requires_payment_method' });

      const status = await provider.getTransactionStatus('pi_status_005');

      expect(status).toBe(PayoutStatus.PENDING);
    });

    it('should map "requires_confirmation" intent status to PayoutStatus.PENDING', async () => {
      mockStripeService.retrieveIntent.mockResolvedValue({ id: 'pi_status_006', status: 'requires_confirmation' });

      const status = await provider.getTransactionStatus('pi_status_006');

      expect(status).toBe(PayoutStatus.PENDING);
    });

    it('should map "requires_action" intent status to PayoutStatus.PENDING', async () => {
      mockStripeService.retrieveIntent.mockResolvedValue({ id: 'pi_status_007', status: 'requires_action' });

      const status = await provider.getTransactionStatus('pi_status_007');

      expect(status).toBe(PayoutStatus.PENDING);
    });

    it('should return PayoutStatus.FAILED for an unrecognised intent status', async () => {
      mockStripeService.retrieveIntent.mockResolvedValue({ id: 'pi_status_unknown', status: 'some_unknown_state' });

      const status = await provider.getTransactionStatus('pi_status_unknown');

      expect(status).toBe(PayoutStatus.FAILED);
    });

    it('should return PayoutStatus.FAILED when retrieveIntent throws', async () => {
      mockStripeService.retrieveIntent.mockRejectedValue(new Error('No such payment_intent'));

      const status = await provider.getTransactionStatus('pi_status_error');

      expect(status).toBe(PayoutStatus.FAILED);
    });
  });
});
