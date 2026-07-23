import { ReferralController } from './referral.controller';

describe('ReferralController', () => {
  let controller: ReferralController;
  let mockService: { getCode: jest.Mock; getStats: jest.Mock };

  beforeEach(() => {
    mockService = {
      getCode: jest.fn(),
      getStats: jest.fn(),
    };
    controller = new ReferralController(mockService as any);
  });

  describe('getCode', () => {
    it('returns referral code and URL', async () => {
      mockService.getCode.mockResolvedValueOnce({
        code: 'ABC123',
        url: 'https://styx.app/join/ABC123',
      });

      const result = await controller.getCode({ id: 'user-1' });

      expect(result.code).toBe('ABC123');
      expect(mockService.getCode).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getRewards', () => {
    it('returns referral stats', async () => {
      mockService.getStats.mockResolvedValueOnce({
        totalReferrals: 2,
        rewardedReferrals: 1,
        pendingReferrals: 1,
        totalRewardCents: 500,
        rewards: [],
      });

      const result = await controller.getRewards({ id: 'user-1' });

      expect(result.totalReferrals).toBe(2);
      expect(mockService.getStats).toHaveBeenCalledWith('user-1');
    });
  });
});
