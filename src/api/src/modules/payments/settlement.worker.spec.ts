import { SettlementWorker } from './settlement.worker';
import { Pool } from 'pg';
import { StripePayoutProvider } from './stripe-payout.provider';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PayoutStatus } from '../../common/interfaces/payout-provider.interface';
import { Job } from 'bullmq';

jest.mock('bullmq');

describe('SettlementWorker', () => {
  let worker: SettlementWorker;
  let mockPool: { query: jest.Mock; connect: jest.Mock };
  let mockClient: { query: jest.Mock; release: jest.Mock };
  let mockStripeProvider: jest.Mocked<Pick<StripePayoutProvider, 'releaseFunds' | 'captureFunds'>>;
  let mockLedger: jest.Mocked<Pick<LedgerService, 'recordTransaction'>>;
  let mockTruthLog: jest.Mocked<Pick<TruthLogService, 'appendEvent'>>;

  const makeJob = (data: Record<string, any>): Job => ({ data } as Job);

  const successResult = {
    status: PayoutStatus.SUCCESS,
    providerTransactionId: 'tx_provider_001',
  };

  const makeContractRow = () => ({
    rows: [{
      user_id: 'user-1',
      account_id: 'acct-user-1',
      escrow_account_id: 'acct-escrow',
      revenue_account_id: 'acct-revenue',
      bounty_pool_account_id: 'acct-bounty',
    }],
  });

  // Helper to drive the client.query mock by SQL keyword, since the worker now runs two
  // separate short transactions (claim + finalize) on a pooled client.
  //
  // entryExists() now keys on the deterministic idempotency_key (styx_settle_<runId>_<type>),
  // matching the DB UNIQUE index. `existingKeys` lets a test declare which idempotency keys
  // already exist so we can assert per-(run, type) idempotency.
  const setupClientQueries = (opts: {
    existingRun?: { id: string; status: string } | null;
    existingKeys?: string[];
  }) => {
    const insertedRunId = 'run-claimed';
    mockClient.query.mockImplementation(async (sql: string, params?: any[]) => {
      const text = String(sql);
      if (text.startsWith('BEGIN') || text.startsWith('COMMIT') || text.startsWith('ROLLBACK')) {
        return { rows: [] };
      }
      if (text.includes('FROM contracts WHERE id') && text.includes('FOR UPDATE')) {
        return { rows: [{ id: 'c-x' }] };
      }
      if (text.includes('FROM settlement_runs') && text.includes('ORDER BY started_at DESC')) {
        return { rows: opts.existingRun ? [opts.existingRun] : [] };
      }
      if (text.includes('INSERT INTO settlement_runs')) {
        return { rows: [{ id: insertedRunId }] };
      }
      if (text.includes('UPDATE settlement_runs') && text.includes("'PROCESSING'")) {
        return { rows: [] };
      }
      // finalizeLedger: contract + system accounts lookup
      if (text.includes('a_escrow') && text.includes('FROM contracts c')) {
        return makeContractRow();
      }
      // entryExists: dedupe by the deterministic idempotency key.
      if (text.includes('FROM entries WHERE idempotency_key')) {
        const [key] = params || [];
        const match = (opts.existingKeys || []).includes(key);
        return { rows: match ? [{ id: 'existing-entry' }] : [] };
      }
      if (text.includes('UPDATE settlement_runs') && text.includes("'SUCCESS'")) {
        return { rows: [] };
      }
      return { rows: [] };
    });
    return insertedRunId;
  };

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockPool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      connect: jest.fn().mockResolvedValue(mockClient),
    };
    mockStripeProvider = {
      releaseFunds: jest.fn(),
      captureFunds: jest.fn(),
    };
    mockLedger = {
      recordTransaction: jest.fn().mockResolvedValue('entry-id-1'),
    };
    mockTruthLog = {
      appendEvent: jest.fn().mockResolvedValue(undefined),
    };

    worker = new SettlementWorker(
      mockPool as unknown as Pool,
      mockStripeProvider as unknown as StripePayoutProvider,
      mockLedger as unknown as LedgerService,
      mockTruthLog as unknown as TruthLogService,
    );

    jest.clearAllMocks();
  });

  const callProcess = (w: SettlementWorker, job: Job) => (w as any).process(job);

  it('should calculate deterministic quote and top up bounty pool on capture', async () => {
    setupClientQueries({ existingRun: null });
    mockStripeProvider.captureFunds.mockResolvedValue(successResult);

    const job = makeJob({
      contractId: 'c-1',
      outcome: 'FAIL',
      paymentIntentId: 'pi_1',
      amountCents: 10000,
    });

    await callProcess(worker, job);

    // captureFunds receives the settlement amount (partial-capture support).
    expect(mockStripeProvider.captureFunds).toHaveBeenCalledWith('pi_1', 10000, expect.any(Object));

    // Ledger capture entry to revenue. A deterministic per-(run, type) idempotency key is
    // passed so the DB UNIQUE index collapses concurrent/retry double-posts (PM4/PM5).
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-escrow',
      'acct-revenue',
      10000,
      'c-1',
      expect.objectContaining({ type: 'REAL_MONEY_SETTLEMENT_CAPTURE' }),
      mockClient,
      'styx_settle_run-claimed_REAL_MONEY_SETTLEMENT_CAPTURE',
    );

    // Bounty pool top-up (20% of 10000).
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-revenue',
      'acct-bounty',
      2000,
      'c-1',
      expect.objectContaining({ type: 'BOUNTY_POOL_TOPUP' }),
      mockClient,
      'styx_settle_run-claimed_BOUNTY_POOL_TOPUP',
    );
  });

  it('should override actual action to RELEASE if dispositionMode is REFUND', async () => {
    setupClientQueries({ existingRun: null });
    mockStripeProvider.releaseFunds.mockResolvedValue(successResult);

    const job = makeJob({
      contractId: 'c-2',
      outcome: 'FAIL',
      paymentIntentId: 'pi_2',
      amountCents: 5000,
      dispositionMode: 'REFUND',
    });

    await callProcess(worker, job);

    expect(mockStripeProvider.releaseFunds).toHaveBeenCalled();
    expect(mockStripeProvider.captureFunds).not.toHaveBeenCalled();

    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-escrow',
      'acct-user-1',
      5000,
      'c-2',
      expect.objectContaining({ type: 'REAL_MONEY_SETTLEMENT_RELEASE', reason: 'REFUND_ONLY_JURISDICTION' }),
      mockClient,
      'styx_settle_run-claimed_REAL_MONEY_SETTLEMENT_RELEASE',
    );
  });

  it('should skip when a SUCCESS run already exists for the (contract, outcome)', async () => {
    setupClientQueries({ existingRun: { id: 'run-done', status: 'SUCCESS' } });

    const job = makeJob({
      contractId: 'c-3',
      outcome: 'FAIL',
      paymentIntentId: 'pi_3',
      amountCents: 5000,
    });

    await callProcess(worker, job);

    expect(mockStripeProvider.captureFunds).not.toHaveBeenCalled();
    expect(mockStripeProvider.releaseFunds).not.toHaveBeenCalled();
    expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
  });

  // PM4/PM5: ledger idempotency keys on the per-(run, type) idempotency_key (matching the DB
  // UNIQUE index), NOT (contract, type, amount).

  it('should skip re-posting a capture entry whose idempotency key already exists (true retry dedupe)', async () => {
    // The capture posting for THIS run already exists → must NOT be re-posted, but the bounty
    // top-up (a different type → different key) is still new and must be written.
    setupClientQueries({
      existingRun: null,
      existingKeys: ['styx_settle_run-claimed_REAL_MONEY_SETTLEMENT_CAPTURE'],
    });
    mockStripeProvider.captureFunds.mockResolvedValue(successResult);

    const job = makeJob({
      contractId: 'c-dup',
      outcome: 'FAIL',
      paymentIntentId: 'pi_dup',
      amountCents: 10000,
    });

    await callProcess(worker, job);

    expect(mockLedger.recordTransaction).not.toHaveBeenCalledWith(
      'acct-escrow',
      'acct-revenue',
      10000,
      'c-dup',
      expect.objectContaining({ type: 'REAL_MONEY_SETTLEMENT_CAPTURE' }),
      mockClient,
      'styx_settle_run-claimed_REAL_MONEY_SETTLEMENT_CAPTURE',
    );
    // The bounty top-up is a distinct type (distinct key) and must still be posted.
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-revenue',
      'acct-bounty',
      2000,
      'c-dup',
      expect.objectContaining({ type: 'BOUNTY_POOL_TOPUP' }),
      mockClient,
      'styx_settle_run-claimed_BOUNTY_POOL_TOPUP',
    );
  });

  it('should post a capture under a NEW run even if a same-amount entry exists under another run (PM5)', async () => {
    // No entry exists for THIS run's key, so the (legitimately distinct) re-settlement posts.
    setupClientQueries({
      existingRun: null,
      existingKeys: [], // nothing for this run's key
    });
    mockStripeProvider.captureFunds.mockResolvedValue(successResult);

    const job = makeJob({
      contractId: 'c-dd',
      outcome: 'FAIL',
      paymentIntentId: 'pi_dd',
      amountCents: 12000,
    });

    await callProcess(worker, job);

    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-escrow',
      'acct-revenue',
      12000,
      'c-dd',
      expect.objectContaining({ type: 'REAL_MONEY_SETTLEMENT_CAPTURE' }),
      mockClient,
      'styx_settle_run-claimed_REAL_MONEY_SETTLEMENT_CAPTURE',
    );
  });

  it('should skip a release posting whose idempotency key already exists (true retry)', async () => {
    setupClientQueries({
      existingRun: null,
      existingKeys: ['styx_settle_run-claimed_REAL_MONEY_SETTLEMENT_RELEASE'],
    });
    mockStripeProvider.releaseFunds.mockResolvedValue(successResult);

    const job = makeJob({
      contractId: 'c-rel',
      outcome: 'PASS',
      paymentIntentId: 'pi_rel',
      amountCents: 5000,
    });

    await callProcess(worker, job);

    expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
  });

  // PM26: the worker must re-derive the amount from the contract and reject a mismatch.
  it('should reject a settlement whose job amount disagrees with the contract stake (PM26)', async () => {
    setupClientQueries({ existingRun: null });
    // Contract stake resolves to 5000¢ ($50) but the job claims 9999¢.
    mockPool.query.mockImplementation(async (sql: string) => {
      if (String(sql).includes('SELECT stake_amount FROM contracts')) {
        return { rows: [{ stake_amount: 50 }] };
      }
      return { rows: [] };
    });

    const job = makeJob({
      contractId: 'c-mismatch',
      outcome: 'FAIL',
      paymentIntentId: 'pi_mismatch',
      amountCents: 9999,
    });

    await expect(callProcess(worker, job)).rejects.toThrow('Settlement amount mismatch');
    expect(mockStripeProvider.captureFunds).not.toHaveBeenCalled();
    expect(mockStripeProvider.releaseFunds).not.toHaveBeenCalled();
  });

  it('should accept a settlement whose job amount matches the contract stake (PM26)', async () => {
    setupClientQueries({ existingRun: null });
    mockStripeProvider.captureFunds.mockResolvedValue(successResult);
    mockPool.query.mockImplementation(async (sql: string) => {
      if (String(sql).includes('SELECT stake_amount FROM contracts')) {
        return { rows: [{ stake_amount: 100 }] }; // $100 → 10000¢
      }
      return { rows: [] };
    });

    const job = makeJob({
      contractId: 'c-ok',
      outcome: 'FAIL',
      paymentIntentId: 'pi_ok',
      amountCents: 10000,
    });

    await callProcess(worker, job);
    expect(mockStripeProvider.captureFunds).toHaveBeenCalledWith('pi_ok', 10000, expect.any(Object));
  });

  // PM31: a failure must only flip the run to FAILED while it is still PROCESSING (guarded UPDATE).
  it('should guard the FAILED status update with status = PROCESSING (PM31)', async () => {
    setupClientQueries({ existingRun: null });
    mockStripeProvider.captureFunds.mockResolvedValue({ status: PayoutStatus.FAILED, error: 'provider boom' });

    const failedUpdates: string[] = [];
    mockPool.query.mockImplementation(async (sql: string) => {
      const text = String(sql);
      if (text.includes('UPDATE settlement_runs') && text.includes("'FAILED'")) {
        failedUpdates.push(text);
      }
      return { rows: [] };
    });

    const job = makeJob({
      contractId: 'c-fail',
      outcome: 'FAIL',
      paymentIntentId: 'pi_fail',
      amountCents: 5000,
    });

    await expect(callProcess(worker, job)).rejects.toThrow('provider boom');
    expect(failedUpdates.length).toBeGreaterThan(0);
    expect(failedUpdates.every((sql) => sql.includes("status = 'PROCESSING'"))).toBe(true);
  });
});
