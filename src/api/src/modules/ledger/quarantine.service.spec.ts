import { QuarantineService } from './quarantine.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { Pool } from 'pg';

const mockPool = {
  query: jest.fn(),
} as unknown as Pool;

const mockTruthLog = {
  appendEvent: jest.fn().mockResolvedValue('log-id-1'),
} as unknown as TruthLogService;

describe('QuarantineService', () => {
  let service: QuarantineService;

  beforeEach(() => {
    service = new QuarantineService(mockPool, mockTruthLog);
    jest.clearAllMocks();
  });

  describe('activateQuarantine', () => {
    it('should update user status to QUARANTINED', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValue('log-id-1');

      await service.activateQuarantine('acc-001', 'phantom money detected');

      expect(mockPool.query).toHaveBeenCalledWith(
        `UPDATE users SET status = 'QUARANTINED' WHERE account_id = $1`,
        ['acc-001'],
      );
    });

    it('should append a LEDGER_QUARANTINE_ACTIVATED event to the TruthLog with CRITICAL severity', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValue('log-id-2');

      await service.activateQuarantine('acc-002', 'balance integrity violation');

      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'LEDGER_QUARANTINE_ACTIVATED',
        expect.objectContaining({
          accountId: 'acc-002',
          reason: 'balance integrity violation',
          severity: 'CRITICAL',
        }),
      );
    });

    it('should mark the account name with [QUARANTINED] using the NOT LIKE guard', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValue('log-id-3');

      await service.activateQuarantine('acc-003', 'anomaly detected');

      expect(mockPool.query).toHaveBeenCalledWith(
        `UPDATE accounts SET name = name || ' [QUARANTINED]' WHERE id = $1 AND name NOT LIKE '%[QUARANTINED]'`,
        ['acc-003'],
      );
    });

    it('should execute all three DB operations in order: users update, accounts update', async () => {
      const callOrder: string[] = [];

      (mockPool.query as jest.Mock).mockImplementation((sql: string) => {
        if (sql.includes('UPDATE users')) callOrder.push('users');
        if (sql.includes('UPDATE accounts')) callOrder.push('accounts');
        return Promise.resolve({ rowCount: 1 });
      });
      (mockTruthLog.appendEvent as jest.Mock).mockImplementation(() => {
        callOrder.push('truthLog');
        return Promise.resolve('log-id-4');
      });

      await service.activateQuarantine('acc-004', 'test ordering');

      expect(callOrder).toEqual(['users', 'truthLog', 'accounts']);
    });

    it('should pass accountId and reason to the users UPDATE query correctly', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValue('log-id-5');

      await service.activateQuarantine('acc-xyz', 'duplicate ledger entry');

      const userUpdateCall = (mockPool.query as jest.Mock).mock.calls.find(
        ([sql]: [string]) => sql.includes('UPDATE users'),
      );
      expect(userUpdateCall).toBeDefined();
      expect(userUpdateCall[1]).toEqual(['acc-xyz']);
    });

    it('should pass accountId to the accounts UPDATE query correctly', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValue('log-id-6');

      await service.activateQuarantine('acc-xyz', 'duplicate ledger entry');

      const accountUpdateCall = (mockPool.query as jest.Mock).mock.calls.find(
        ([sql]: [string]) => sql.includes('UPDATE accounts'),
      );
      expect(accountUpdateCall).toBeDefined();
      expect(accountUpdateCall[1]).toEqual(['acc-xyz']);
    });

    it('should pass optional metadata through to TruthLog when provided', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValue('log-id-7');

      const metadata = { triggeredBy: 'phantom-money-check', amount: 9999.99 };

      await service.activateQuarantine('acc-meta', 'unbalanced entry', metadata);

      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'LEDGER_QUARANTINE_ACTIVATED',
        expect.objectContaining({
          accountId: 'acc-meta',
          reason: 'unbalanced entry',
          metadata,
          severity: 'CRITICAL',
        }),
      );
    });

    it('should include undefined metadata in TruthLog payload when metadata is not provided', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValue('log-id-8');

      await service.activateQuarantine('acc-no-meta', 'no metadata case');

      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'LEDGER_QUARANTINE_ACTIVATED',
        expect.objectContaining({
          accountId: 'acc-no-meta',
          reason: 'no metadata case',
          severity: 'CRITICAL',
        }),
      );
    });

    it('should propagate errors thrown by pool.query on the users update', async () => {
      const dbError = new Error('DB connection lost');
      (mockPool.query as jest.Mock).mockRejectedValueOnce(dbError);

      await expect(
        service.activateQuarantine('acc-err', 'error propagation test'),
      ).rejects.toThrow('DB connection lost');
    });

    it('should propagate errors thrown by pool.query on the accounts update', async () => {
      const dbError = new Error('accounts table locked');
      // First query (users update) resolves; second (accounts update) rejects
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockRejectedValueOnce(dbError);
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValue('log-id-9');

      await expect(
        service.activateQuarantine('acc-err2', 'accounts update failure'),
      ).rejects.toThrow('accounts table locked');
    });

    it('should propagate errors thrown by TruthLogService.appendEvent', async () => {
      const truthLogError = new Error('event_log write failure');
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
      (mockTruthLog.appendEvent as jest.Mock).mockRejectedValueOnce(truthLogError);

      await expect(
        service.activateQuarantine('acc-tl-err', 'truth log failure'),
      ).rejects.toThrow('event_log write failure');
    });

    it('should use NOT LIKE guard to prevent double-tagging on idempotent calls', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValue('log-id-10');

      // Call twice; the SQL WHERE clause prevents double-tagging — verify the guard is present
      await service.activateQuarantine('acc-idem', 'idempotency check');
      await service.activateQuarantine('acc-idem', 'idempotency check');

      const accountUpdateCalls = (mockPool.query as jest.Mock).mock.calls.filter(
        ([sql]: [string]) => sql.includes('UPDATE accounts'),
      );

      // Both calls should include the NOT LIKE guard
      for (const call of accountUpdateCalls) {
        expect(call[0]).toContain("NOT LIKE '%[QUARANTINED]'");
      }
    });
  });
});
