import { NotFoundException } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { Pool } from 'pg';

describe('WalletController', () => {
  let controller: WalletController;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    controller = new WalletController(mockPool as unknown as Pool);
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return user balance with integrity tiers', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-1',
          email: 'user@styx.app',
          integrity_score: 75,
          account_id: 'acct-1',
          status: 'ACTIVE',
        }],
      });
      // Credit sum
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '150.0000' }] });
      // Debit sum
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '50.0000' }] });

      const result = await controller.getBalance({ id: 'user-1' });

      expect(result.userId).toBe('user-1');
      expect(result.email).toBe('user@styx.app');
      expect(result.integrityScore).toBe(75);
      expect(result.ledgerBalance).toBe(100); // 150 - 50
      expect(result.allowedTiers).toEqual(['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD']);
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw NotFoundException for missing user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(controller.getBalance({ id: 'missing' })).rejects.toThrow(NotFoundException);
    });

    it('should return zero balance when user has no account_id', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-2',
          email: 'new@styx.app',
          integrity_score: 50,
          account_id: null,
          status: 'ACTIVE',
        }],
      });

      const result = await controller.getBalance({ id: 'user-2' });

      expect(result.ledgerBalance).toBe(0);
      // Should NOT query entries at all
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('should return RESTRICTED_MODE tier for very low integrity score', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-bad',
          email: 'bad@styx.app',
          integrity_score: 5,
          account_id: null,
          status: 'ACTIVE',
        }],
      });

      const result = await controller.getBalance({ id: 'user-bad' });

      expect(result.allowedTiers).toEqual(['RESTRICTED_MODE']);
    });

    it('should return all tiers for whale-level integrity score', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-whale',
          email: 'whale@styx.app',
          integrity_score: 600,
          account_id: 'acct-w',
          status: 'ACTIVE',
        }],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      const result = await controller.getBalance({ id: 'user-whale' });

      expect(result.allowedTiers).toContain('TIER_4_WHALE_VAULTS');
      expect(result.allowedTiers).toHaveLength(4);
    });
  });

  describe('getHistory', () => {
    it('should return transaction history for user', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ account_id: 'acct-1' }],
      });
      const txns = [
        { id: 'e-1', amount: '25.0000', debit_account_name: 'UserAcct', credit_account_name: 'Escrow' },
        { id: 'e-2', amount: '10.0000', debit_account_name: 'Escrow', credit_account_name: 'UserAcct' },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: txns });

      const result = await controller.getHistory({ id: 'user-1' });

      expect(result.transactions).toEqual(txns);
    });

    it('should throw NotFoundException for missing user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(controller.getHistory({ id: 'missing' })).rejects.toThrow(NotFoundException);
    });

    it('should return empty transactions when user has no account', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ account_id: null }],
      });

      const result = await controller.getHistory({ id: 'user-no-acct' });

      expect(result.transactions).toEqual([]);
    });

    it('should respect the limit parameter capped at 100', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ account_id: 'acct-1' }],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await controller.getHistory({ id: 'user-1' }, '200');

      // Limit should be capped at 100
      const historyCall = mockPool.query.mock.calls[1];
      expect(historyCall[1][1]).toBe(100);
    });

    it('should default to limit 50 when not specified', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ account_id: 'acct-1' }],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await controller.getHistory({ id: 'user-1' });

      const historyCall = mockPool.query.mock.calls[1];
      expect(historyCall[1][1]).toBe(50);
    });
  });
});
