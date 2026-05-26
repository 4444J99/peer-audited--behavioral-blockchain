import { LedgerService } from './ledger.service';
import { Pool } from 'pg';

// Create a mock Pool object with jest implementations
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  connect: jest.fn().mockResolvedValue(mockClient),
  query: jest.fn(),
} as unknown as Pool;

describe('LedgerService', () => {
  let service: LedgerService;

  beforeEach(() => {
    service = new LedgerService(mockPool);
    jest.clearAllMocks();
    (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  // ── recordTransaction ──────────────────────────────────────────

  describe('recordTransaction', () => {
    it('should successfully record a transaction with BEGIN and COMMIT', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'mock-uuid-123' }] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const resultId = await service.recordTransaction('account-A', 'account-B', 5000);

      expect(resultId).toBe('mock-uuid-123');
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should execute a ROLLBACK on error and re-throw', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Simulated Database Error')); // INSERT fails

      await expect(service.recordTransaction('account-A', 'account-B', 5000))
        .rejects
        .toThrow('Simulated Database Error');

      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should reject non-positive amounts', async () => {
      await expect(service.recordTransaction('account-A', 'account-B', -10))
        .rejects
        .toThrow('Transaction amount must be strictly positive');

      expect(mockPool.connect).not.toHaveBeenCalled();
    });

    it('should reject zero amount', async () => {
      await expect(service.recordTransaction('account-A', 'account-B', 0))
        .rejects
        .toThrow('Transaction amount must be strictly positive');

      expect(mockPool.connect).not.toHaveBeenCalled();
    });

    it('should reject non-integer amounts (cents only)', async () => {
      await expect(service.recordTransaction('account-A', 'account-B', 10.5))
        .rejects
        .toThrow('Transaction amount must be an integer (cents)');

      expect(mockPool.connect).not.toHaveBeenCalled();
    });

    it('should reject same debit and credit account', async () => {
      await expect(service.recordTransaction('account-A', 'account-A', 1000))
        .rejects
        .toThrow('Debit and credit accounts must be different');

      expect(mockPool.connect).not.toHaveBeenCalled();
    });

    it('should pass contractId and metadata when provided', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'entry-with-meta' }] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const meta = { type: 'STAKE_HOLD', note: 'test' };
      const resultId = await service.recordTransaction('acct-A', 'acct-B', 3000, 'contract-1', meta);

      expect(resultId).toBe('entry-with-meta');
      const insertCall = mockClient.query.mock.calls[1];
      expect(insertCall[1]).toEqual(['acct-A', 'acct-B', 3000, 'contract-1', meta]);
    });

    it('should use provided client and skip BEGIN/COMMIT when external client given', async () => {
      const externalClient = { query: jest.fn(), release: jest.fn() };
      externalClient.query.mockResolvedValueOnce({ rows: [{ id: 'ext-entry' }] }); // INSERT only

      const resultId = await service.recordTransaction('acct-A', 'acct-B', 500, undefined, undefined, externalClient as any);

      expect(resultId).toBe('ext-entry');
      expect(externalClient.query).toHaveBeenCalledTimes(1); // only INSERT, no BEGIN/COMMIT
      expect(mockPool.connect).not.toHaveBeenCalled();
      expect(externalClient.release).not.toHaveBeenCalled(); // caller manages external client
    });

    it('should insert with ON CONFLICT DO NOTHING when an idempotency key is supplied', async () => {
      const externalClient = { query: jest.fn(), release: jest.fn() };
      externalClient.query.mockResolvedValueOnce({ rows: [{ id: 'idem-entry' }] }); // INSERT wins

      const resultId = await service.recordTransaction(
        'acct-A', 'acct-B', 500, 'contract-1', { type: 'X' }, externalClient as any, 'styx_key_1',
      );

      expect(resultId).toBe('idem-entry');
      const insertCall = externalClient.query.mock.calls[0];
      // Must repeat the partial-index predicate so Postgres infers the partial
      // UNIQUE index (migration 030) as the conflict arbiter.
      expect(insertCall[0]).toContain(
        'ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING',
      );
      expect(insertCall[1]).toEqual(['acct-A', 'acct-B', 500, 'contract-1', { type: 'X' }, 'styx_key_1']);
    });

    it('should return the pre-existing entry id when the idempotency key collides (no double-post)', async () => {
      const externalClient = { query: jest.fn(), release: jest.fn() };
      externalClient.query
        .mockResolvedValueOnce({ rows: [] }) // INSERT swallowed by ON CONFLICT DO NOTHING
        .mockResolvedValueOnce({ rows: [{ id: 'existing-entry' }] }); // SELECT existing

      const resultId = await service.recordTransaction(
        'acct-A', 'acct-B', 500, 'contract-1', { type: 'X' }, externalClient as any, 'styx_key_dup',
      );

      expect(resultId).toBe('existing-entry');
      expect(externalClient.query).toHaveBeenCalledTimes(2); // INSERT + SELECT, no extra posting
    });
  });

  // ── getAccountBalance ──────────────────────────────────────────

  describe('getAccountBalance', () => {
    it('should return positive balance when credits exceed debits (liability model)', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ balance: '5000' }],
      });

      const balance = await service.getAccountBalance('acct-1');

      expect(balance).toBe(5000);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('credit_account_id'),
        ['acct-1'],
      );
    });

    it('should return negative balance when debits exceed credits', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ balance: '-2500' }],
      });

      const balance = await service.getAccountBalance('acct-2');

      expect(balance).toBe(-2500);
    });

    it('should return zero for an account with no entries', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ balance: '0' }],
      });

      const balance = await service.getAccountBalance('acct-empty');

      expect(balance).toBe(0);
    });
  });

  // ── getContractLedger ──────────────────────────────────────────

  describe('getContractLedger', () => {
    it('should return mapped ledger entries for a contract', async () => {
      const now = new Date();
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 'entry-1',
            debit_account_id: 'user-acct',
            credit_account_id: 'escrow-acct',
            amount: '3000',
            metadata: { type: 'STAKE_HOLD' },
            created_at: now,
          },
          {
            id: 'entry-2',
            debit_account_id: 'escrow-acct',
            credit_account_id: 'user-acct',
            amount: '3000',
            metadata: { type: 'STAKE_RETURN' },
            created_at: now,
          },
        ],
      });

      const entries = await service.getContractLedger('contract-1');

      expect(entries).toHaveLength(2);
      expect(entries[0]).toEqual({
        id: 'entry-1',
        debitAccountId: 'user-acct',
        creditAccountId: 'escrow-acct',
        amount: 3000,
        metadata: { type: 'STAKE_HOLD' },
        createdAt: now,
      });
      expect(entries[1].debitAccountId).toBe('escrow-acct');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('contract_id'),
        ['contract-1'],
      );
    });

    it('should return empty array for contract with no entries', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const entries = await service.getContractLedger('contract-empty');

      expect(entries).toEqual([]);
    });

    it('should handle null metadata in entries', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 'entry-3',
          debit_account_id: 'a',
          credit_account_id: 'b',
          amount: '100',
          metadata: null,
          created_at: new Date(),
        }],
      });

      const entries = await service.getContractLedger('contract-2');

      expect(entries[0].metadata).toBeNull();
    });
  });

  // ── verifyLedgerIntegrity ──────────────────────────────────────

  describe('verifyLedgerIntegrity', () => {
    // The rewritten implementation runs two queries:
    //   1. conservation aggregate → { total_debits, total_credits } (reporting only)
    //   2. structural-invariant aggregate → a single row of violation counts:
    //      { non_positive_count, self_entry_count, orphaned_count }
    // balanced is true ONLY when all three violation counts are zero. These checks
    // are genuinely falsifiable (unlike the old tautological global-sum check).
    const clean = { non_positive_count: '0', self_entry_count: '0', orphaned_count: '0' };

    it('should return balanced=true for a clean ledger (no violations)', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total_debits: '10000', total_credits: '10000' }] }) // conservation
        .mockResolvedValueOnce({ rows: [clean] }); // integrity — no violations

      const result = await service.verifyLedgerIntegrity();

      expect(result.balanced).toBe(true);
      expect(result.totalDebits).toBe(10000);
      expect(result.totalCredits).toBe(10000);
    });

    it('should return balanced=true for empty ledger', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total_debits: '0', total_credits: '0' }] })
        .mockResolvedValueOnce({ rows: [clean] });

      const result = await service.verifyLedgerIntegrity();

      expect(result.balanced).toBe(true);
    });

    it('should return balanced=false when an entry has a non-positive amount', async () => {
      // A zero/negative amount means money was minted or destroyed on a posting.
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total_debits: '5000', total_credits: '5000' }] })
        .mockResolvedValueOnce({ rows: [{ ...clean, non_positive_count: '1' }] });

      const result = await service.verifyLedgerIntegrity();
      expect(result.balanced).toBe(false);
    });

    it('should return balanced=false when an entry debits and credits the same account', async () => {
      // A self-referential row is a no-op that can mask a lost posting.
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total_debits: '5000', total_credits: '5000' }] })
        .mockResolvedValueOnce({ rows: [{ ...clean, self_entry_count: '2' }] });

      const result = await service.verifyLedgerIntegrity();
      expect(result.balanced).toBe(false);
    });

    it('should surface the actual violation counts (LC8) so incident response is not misled by equal totals', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total_debits: '5000', total_credits: '5000' }] })
        .mockResolvedValueOnce({ rows: [{ non_positive_count: '1', self_entry_count: '2', orphaned_count: '3' }] });

      const result = await service.verifyLedgerIntegrity();
      expect(result.balanced).toBe(false);
      expect(result.nonPositiveCount).toBe(1);
      expect(result.selfEntryCount).toBe(2);
      expect(result.orphanedCount).toBe(3);
    });

    it('should return balanced=false when an entry references a non-existent account (orphaned)', async () => {
      // An orphaned debit/credit reference points at money in no real account.
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total_debits: '5000', total_credits: '5000' }] })
        .mockResolvedValueOnce({ rows: [{ ...clean, orphaned_count: '1' }] });

      const result = await service.verifyLedgerIntegrity();
      expect(result.balanced).toBe(false);
    });

    it('should still expose conservation SUMs for reporting even when balanced', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total_debits: '4200', total_credits: '4200' }] })
        .mockResolvedValueOnce({ rows: [clean] });

      const result = await service.verifyLedgerIntegrity();
      expect(result.balanced).toBe(true);
      expect(result.totalDebits).toBe(4200);
      expect(result.totalCredits).toBe(4200);
    });

    it('should use provided client instead of pool', async () => {
      const externalClient = { query: jest.fn() };
      externalClient.query
        .mockResolvedValueOnce({ rows: [{ total_debits: '0', total_credits: '0' }] })
        .mockResolvedValueOnce({ rows: [clean] });

      const result = await service.verifyLedgerIntegrity(externalClient as any);

      expect(result.balanced).toBe(true);
      expect(externalClient.query).toHaveBeenCalledTimes(2);
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });
});
