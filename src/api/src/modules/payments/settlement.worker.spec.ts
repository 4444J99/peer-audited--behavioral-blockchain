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
  // entryExists() now keys on (contract_id, metadata->>'type', amount): params are
  // [contractId, type, amountCents]. `existingEntries` lets a test declare which
  // (type, amount) postings already exist so we can assert amount-aware idempotency.
  const setupClientQueries = (opts: {
    existingRun?: { id: string; status: string } | null;
    existingEntries?: Array<{ type: string; amount: number }>;
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
      // entryExists: dedupe ONLY on an exact (type, amount) match so a different amount
      // for the same type is correctly treated as a new posting.
      if (text.includes('FROM entries WHERE contract_id') && text.includes("metadata->>'type'")) {
        const [, type, amount] = params || [];
        const match = (opts.existingEntries || []).some(
          (e) => e.type === type && e.amount === amount,
        );
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

    // Ledger capture entry to revenue.
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-escrow',
      'acct-revenue',
      10000,
      'c-1',
      expect.objectContaining({ type: 'REAL_MONEY_SETTLEMENT_CAPTURE' }),
      mockClient,
    );

    // Bounty pool top-up (20% of 10000).
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-revenue',
      'acct-bounty',
      2000,
      'c-1',
      expect.objectContaining({ type: 'BOUNTY_POOL_TOPUP' }),
      mockClient,
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

  // FINDING 3: ledger idempotency must key on amount too, not just (contract, type).

  it('should skip re-posting a capture entry that already exists for the SAME amount (true retry dedupe)', async () => {
    // The capture posting for 10000¢ already exists → must NOT be re-posted, but the
    // bounty top-up (2000¢, a different type/amount) is still new and must be written.
    setupClientQueries({
      existingRun: null,
      existingEntries: [{ type: 'REAL_MONEY_SETTLEMENT_CAPTURE', amount: 10000 }],
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
    );
    // The bounty top-up is a distinct (type, amount) and must still be posted.
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-revenue',
      'acct-bounty',
      2000,
      'c-dup',
      expect.objectContaining({ type: 'BOUNTY_POOL_TOPUP' }),
      mockClient,
    );
  });

  it('should NOT skip a capture posting of a DIFFERENT amount for the same (contract, type)', async () => {
    // A prior posting of 5000¢ exists, but this re-dispatch (e.g. after a double-down)
    // settles 12000¢. The new amount must be posted, not wrongly deduped.
    setupClientQueries({
      existingRun: null,
      existingEntries: [{ type: 'REAL_MONEY_SETTLEMENT_CAPTURE', amount: 5000 }],
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
    );
  });

  it('should skip a release posting that already exists for the same amount', async () => {
    setupClientQueries({
      existingRun: null,
      existingEntries: [{ type: 'REAL_MONEY_SETTLEMENT_RELEASE', amount: 5000 }],
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
});
