import { ReferralService } from './referral.service';

describe('ReferralService', () => {
  let service: ReferralService;
  let mockPool: { query: jest.Mock };
  let mockLedger: { recordTransaction: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockLedger = { recordTransaction: jest.fn().mockResolvedValue(undefined) };
    service = new ReferralService(mockPool as any, mockLedger as any);
  });

  describe('getOrCreateCode', () => {
    it('returns existing code if user has one', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ referral_code: 'ABC123' }] });

      const code = await service.getOrCreateCode('user-1');

      expect(code).toBe('ABC123');
    });

    it('generates and stores a new code if user lacks one', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ referral_code: null }] }) // no existing code
        .mockResolvedValueOnce({ rows: [] }); // no clash

      const code = await service.getOrCreateCode('user-1');

      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[A-Z0-9]+$/);
      expect(mockPool.query.mock.calls[2][0]).toContain('UPDATE users');
    });

    it('throws if user not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.getOrCreateCode('no-such-user')).rejects.toThrow('User not found');
    });
  });

  describe('getCode', () => {
    it('returns code and share URL', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ referral_code: 'XYZ789' }] });

      const result = await service.getCode('user-1');

      expect(result.code).toBe('XYZ789');
      expect(result.url).toContain('/XYZ789');
    });
  });

  describe('attributeReferral', () => {
    it('attributes new user to referrer', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'referrer-1' }] }) // referrer found
        .mockResolvedValueOnce({ rowCount: 1 }) // update users.referred_by
        .mockResolvedValueOnce({ rows: [] }); // insert referral

      await service.attributeReferral('CODE1', 'new-user-1');

      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    it('skips if referral code not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.attributeReferral('INVALID', 'new-user-1');

      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('skips self-referral', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'user-1' }] });

      await service.attributeReferral('SELF', 'user-1');

      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('rewardOnFirstContract', () => {
    it('pays reward via ledger for pending referral', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'ref-1',
            referrer_id: 'referrer-1',
            status: 'PENDING',
            reward_amount_cents: 500,
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // monthly cap: under limit
        .mockResolvedValueOnce({ rows: [{ account_id: 'acct-referrer' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'acct-revenue' }] })
        .mockResolvedValueOnce({ rowCount: 1 }); // update referral status

      await service.rewardOnFirstContract('referred-user-1', 'contract-1');

      expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
        'acct-revenue',
        'acct-referrer',
        500,
        'contract-1',
        expect.objectContaining({ type: 'REFERRAL_REWARD' }),
      );
    });

    it('skips if no pending referral', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.rewardOnFirstContract('referred-user-1', 'contract-1');

      expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns aggregated referral stats', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{
            total: 3,
            rewarded: 2,
            pending: 1,
            total_cents: 1000,
          }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'r1',
              referred_user_email: 'user2@test.com',
              status: 'REWARDED',
              reward_amount_cents: 500,
              reward_paid_at: new Date('2026-07-01'),
              created_at: new Date('2026-06-01'),
            },
          ],
        });

      const stats = await service.getStats('user-1');

      expect(stats.totalReferrals).toBe(3);
      expect(stats.rewardedReferrals).toBe(2);
      expect(stats.pendingReferrals).toBe(1);
      expect(stats.totalRewardCents).toBe(1000);
      expect(stats.rewards).toHaveLength(1);
      expect(stats.rewards[0].referredUserEmail).toBe('user2@test.com');

      // referrals has no email column — referred_user_email is an alias produced
      // by the join to users, so the join must stay in the query.
      const rewardsSql = String(mockPool.query.mock.calls[1][0]);
      expect(rewardsSql).toContain('u.email AS referred_user_email');
      expect(rewardsSql).toContain('JOIN users u ON u.id = r.referred_user_id');
    });
  });
});
