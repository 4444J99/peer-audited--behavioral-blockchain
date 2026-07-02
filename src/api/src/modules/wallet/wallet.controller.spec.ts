import { NotFoundException } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { Pool } from 'pg';
import { LedgerService } from '../../../services/ledger/ledger.service';

describe('WalletController', () => {
  let controller: WalletController;
  let mockPool: { query: jest.Mock };
  let mockLedger: { getAccountBalance: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockLedger = { getAccountBalance: jest.fn() };
    controller = new WalletController(
      mockPool as unknown as Pool,
      mockLedger as unknown as LedgerService,
    );
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return user balance with integrity tiers', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-1',
          email: '[email redacted]',
          integrity_score: 75,
          account_id: 'acct-1',
          status: 'ACTIVE',
        }],
      });
      mockLedger.getAccountBalance.mockResolvedValueOnce(5000); // 5000 cents

      const result = await controller.getBalance({ id: 'user-1' });

      expect(result).toEqual({
        id: 'user-1',
        email: '[email redacted]',
        integrity_score: 75,
        ledger_balance: 50, // 5000 cents / 100
        allowed_tiers: ['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD'],
        status: 'ACTIVE',
      });
      expect(mockLedger.getAccountBalance).toHaveBeenCalledWith('acct-1');
    });

    it('should throw NotFoundException for missing user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(controller.getBalance({ id: 'missing' })).rejects.toThrow(NotFoundException);
    });

    it('should return zero balance when user has no account_id', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-2',
          email: '[email redacted]',
          integrity_score: 50,
          account_id: null,
          status: 'ACTIVE',
        }],
      });

      const result = await controller.getBalance({ id: 'user-2' });

      expect(result.ledger_balance).toBe(0);
      // Should NOT query entries at all
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHistory', () => {
    it('should return transaction history for user', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ account_id: 'acct-1' }],
      });
      const dbRows = [
        {
          id: 'e-1',
          amount: '2500',
          // A stake hold debits the user account, so under the canonical sign
          // convention it must show as a negative amount in history.
          debit_account_id: 'acct-1',
          credit_account_id: 'escrow-acct',
          metadata: { type: 'STAKE_HOLD', description: 'Testing' },
          created_at: '2026-01-01T00:00:00Z'
        },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: dbRows });

      const result = await controller.getHistory({ id: 'user-1' });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0]).toEqual({
        id: 'e-1',
        type: 'STAKE_HOLD',
        amount: -25, // debit leg → negative under canonical sign convention
        timestamp: '2026-01-01T00:00:00Z',
        description: 'Testing',
      });
    });

    it('should sign credit entries as positive (e.g. stake refund)', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ account_id: 'acct-1' }],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'e-2',
            amount: '2500',
            debit_account_id: 'escrow-acct',
            credit_account_id: 'acct-1',
            metadata: { type: 'STAKE_RETURN', description: 'Refund' },
            created_at: '2026-01-02T00:00:00Z',
          },
        ],
      });

      const result = await controller.getHistory({ id: 'user-1' });

      expect(result.transactions[0].amount).toBe(25);
    });

    it('should default limit to 50 when limit is NaN', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ account_id: 'acct-1' }],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await controller.getHistory({ id: 'user-1' }, 'abc');

      const historyCall = mockPool.query.mock.calls[1];
      expect(historyCall[1][1]).toBe(50);
    });

    it('should clamp limit to a minimum of 1', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ account_id: 'acct-1' }],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await controller.getHistory({ id: 'user-1' }, '0');

      const historyCall = mockPool.query.mock.calls[1];
      expect(historyCall[1][1]).toBe(1);
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
  });
});
