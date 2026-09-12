import { ReferralController } from './referral.controller';

describe('ReferralController', () => {
  let controller: ReferralController;
  let mockService: {
    getCode: jest.Mock;
    getStats: jest.Mock;
    getCohortInviteQuota: jest.Mock;
    nominateCohortPeer: jest.Mock;
  };

  beforeEach(() => {
    mockService = {
      getCode: jest.fn(),
      getStats: jest.fn(),
      getCohortInviteQuota: jest.fn(),
      nominateCohortPeer: jest.fn(),
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

  describe('getCohortInvites', () => {
    it('delegates to service.getCohortInviteQuota', async () => {
      const quota = {
        totalAllowed: 2,
        invitesSent: 1,
        remainingInvites: 1,
        nominations: [],
      };
      mockService.getCohortInviteQuota.mockResolvedValueOnce(quota);

      const result = await controller.getCohortInvites({ id: 'user-1' });
      expect(result).toBe(quota);
      expect(mockService.getCohortInviteQuota).toHaveBeenCalledWith('user-1');
    });
  });

  describe('nominate', () => {
    it('delegates to service.nominateCohortPeer with body parameters', async () => {
      const nomination = { id: 'nom-1', inviteCode: 'COHORT-XYZ' };
      mockService.nominateCohortPeer.mockResolvedValueOnce(nomination);

      const result = await controller.nominate(
        { id: 'user-1' },
        { nomineeEmail: 'friend@test.com', nomineeName: 'Friend', note: 'Recommended' },
      );

      expect(result).toBe(nomination);
      expect(mockService.nominateCohortPeer).toHaveBeenCalledWith(
        'user-1',
        'friend@test.com',
        'Friend',
        'Recommended',
      );
    });
  });
});
