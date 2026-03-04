import { SettlementWorker } from './settlement.worker';
import { Pool } from 'pg';
import { StripePayoutProvider } from './stripe-payout.provider';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PayoutStatus } from '../../common/interfaces/payout-provider.interface';
import { Job } from 'bullmq';

// Prevent real BullMQ Worker from being created in onModuleInit
jest.mock('bullmq');

describe('SettlementWorker', () => {
  let worker: SettlementWorker;
  let mockPool: { query: jest.Mock };
  let mockStripeProvider: jest.Mocked<Pick<StripePayoutProvider, 'releaseFunds' | 'captureFunds'>>;
  let mockLedger: jest.Mocked<Pick<LedgerService, 'recordTransaction'>>;
  let mockTruthLog: jest.Mocked<Pick<TruthLogService, 'appendEvent'>>;

  // Helper: build a fake BullMQ Job
  const makeJob = (data: Record<string, any>): Job => ({ data } as Job);

  // Default successful payout result
  const successResult = {
    status: PayoutStatus.SUCCESS,
    providerTransactionId: 'tx_provider_001',
  };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
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

  // Re-expose the private process method for testing
  const callProcess = (w: SettlementWorker, job: Job) =>
    (w as any).process(job);

  // Helper: standard contract + account row returned by the finalizeLedger query
  const makeContractRow = () => ({
    rows: [{
      user_id: 'user-1',
      account_id: 'acct-user-1',
      escrow_account_id: 'acct-escrow',
      revenue_account_id: 'acct-revenue',
    }],
  });

  // ─── Idempotency ─────────────────────────────────────────────────

  describe('idempotency', () => {
    it('should skip processing when a successful settlement already exists', async () => {
      // Existing SUCCESS row found
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'existing-run-1' }] });

      const job = makeJob({
        contractId: 'contract-idem',
        outcome: 'PASS',
        paymentIntentId: 'pi_idem',
        amountCents: 5000,
      });

      await callProcess(worker, job);

      // Should have queried for existing run, then stopped
      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockStripeProvider.releaseFunds).not.toHaveBeenCalled();
      expect(mockStripeProvider.captureFunds).not.toHaveBeenCalled();
    });

    it('should check for existing settlement with correct contract_id, outcome, and status', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'run-done' }] });

      const job = makeJob({
        contractId: 'contract-check',
        outcome: 'FAIL',
        paymentIntentId: 'pi_check',
        amountCents: 3000,
      });

      await callProcess(worker, job);

      const [sql, params] = mockPool.query.mock.calls[0];
      expect(sql).toMatch(/SELECT id FROM settlement_runs/);
      expect(sql).toMatch(/status = 'SUCCESS'/);
      expect(params).toContain('contract-check');
      expect(params).toContain('FAIL');
    });
  });

  // ─── settlement_runs record creation ─────────────────────────────

  describe('settlement_runs INSERT', () => {
    it('should create a settlement_runs record with PROCESSING status', async () => {
      // No existing SUCCESS run
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // INSERT settlement_runs → return runId
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'run-new-1' }] });
      // Stripe release
      mockStripeProvider.releaseFunds = jest.fn().mockResolvedValue(successResult);
      // finalizeLedger → contract lookup
      mockPool.query.mockResolvedValueOnce(makeContractRow());
      // ledger.recordTransaction (mocked, no pool call)
      // UPDATE settlement_runs to SUCCESS
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const job = makeJob({
        contractId: 'contract-insert',
        outcome: 'PASS',
        paymentIntentId: 'pi_insert',
        amountCents: 4000,
      });

      await callProcess(worker, job);

      const insertCall = mockPool.query.mock.calls[1];
      expect(insertCall[0]).toMatch(/INSERT INTO settlement_runs/);
      expect(insertCall[0]).toMatch(/'PROCESSING'/);
      expect(insertCall[1]).toContain('contract-insert');
      expect(insertCall[1]).toContain('PASS');
      expect(insertCall[1]).toContain(4000);
    });
  });

  // ─── Stripe provider calls ────────────────────────────────────────

  describe('Stripe provider routing', () => {
    it('should call releaseFunds for PASS outcome', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no existing run
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'run-pass' }] }); // INSERT
      mockStripeProvider.releaseFunds = jest.fn().mockResolvedValue(successResult);
      mockPool.query.mockResolvedValueOnce(makeContractRow()); // finalizeLedger
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE SUCCESS

      const job = makeJob({
        contractId: 'contract-pass',
        outcome: 'PASS',
        paymentIntentId: 'pi_pass_001',
        amountCents: 9000,
      });

      await callProcess(worker, job);

      expect(mockStripeProvider.releaseFunds).toHaveBeenCalledWith('pi_pass_001', 9000);
      expect(mockStripeProvider.captureFunds).not.toHaveBeenCalled();
    });

    it('should call captureFunds for FAIL outcome', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no existing run
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'run-fail' }] }); // INSERT
      mockStripeProvider.captureFunds = jest.fn().mockResolvedValue(successResult);
      mockPool.query.mockResolvedValueOnce(makeContractRow()); // finalizeLedger
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE SUCCESS

      const job = makeJob({
        contractId: 'contract-fail',
        outcome: 'FAIL',
        paymentIntentId: 'pi_fail_001',
        amountCents: 12000,
        furies: ['fury-user-1'],
      });

      await callProcess(worker, job);

      expect(mockStripeProvider.captureFunds).toHaveBeenCalledWith(
        'pi_fail_001',
        12000,
        { furies: ['fury-user-1'] },
      );
      expect(mockStripeProvider.releaseFunds).not.toHaveBeenCalled();
    });
  });

  // ─── Success path ─────────────────────────────────────────────────

  describe('success path', () => {
    const setupSuccess = (outcome: 'PASS' | 'FAIL') => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no existing run
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'run-success' }] }); // INSERT
      if (outcome === 'PASS') {
        mockStripeProvider.releaseFunds = jest.fn().mockResolvedValue(successResult);
      } else {
        mockStripeProvider.captureFunds = jest.fn().mockResolvedValue(successResult);
      }
      mockPool.query.mockResolvedValueOnce(makeContractRow()); // finalizeLedger
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE SUCCESS
    };

    it('should update settlement_runs to SUCCESS after successful provider call', async () => {
      setupSuccess('PASS');

      const job = makeJob({
        contractId: 'contract-ok',
        outcome: 'PASS',
        paymentIntentId: 'pi_ok',
        amountCents: 6000,
      });

      await callProcess(worker, job);

      // The UPDATE to SUCCESS is the last pool.query call
      const updateCall = mockPool.query.mock.calls[mockPool.query.mock.calls.length - 1];
      expect(updateCall[0]).toMatch(/UPDATE settlement_runs/);
      expect(updateCall[0]).toMatch(/status = 'SUCCESS'/);
      expect(updateCall[1]).toContain('tx_provider_001');
      expect(updateCall[1]).toContain('run-success');
    });

    it('should log SETTLEMENT_COMPLETED to TruthLog on success', async () => {
      setupSuccess('PASS');

      const job = makeJob({
        contractId: 'contract-truthlog',
        outcome: 'PASS',
        paymentIntentId: 'pi_tlog',
        amountCents: 7000,
      });

      await callProcess(worker, job);

      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'SETTLEMENT_COMPLETED',
        expect.objectContaining({
          contractId: 'contract-truthlog',
          outcome: 'PASS',
          runId: 'run-success',
          providerTransactionId: 'tx_provider_001',
        }),
      );
    });

    it('should call finalizeLedger after successful Stripe call', async () => {
      setupSuccess('PASS');

      const job = makeJob({
        contractId: 'contract-ledger',
        outcome: 'PASS',
        paymentIntentId: 'pi_ledger',
        amountCents: 5500,
      });

      await callProcess(worker, job);

      expect(mockLedger.recordTransaction).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Error path ───────────────────────────────────────────────────

  describe('error path', () => {
    it('should update settlement_runs to FAILED on Stripe error', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no existing run
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'run-err' }] }); // INSERT
      mockStripeProvider.releaseFunds = jest
        .fn()
        .mockRejectedValue(new Error('Stripe unavailable'));
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE FAILED

      const job = makeJob({
        contractId: 'contract-err',
        outcome: 'PASS',
        paymentIntentId: 'pi_err',
        amountCents: 4500,
      });

      await expect(callProcess(worker, job)).rejects.toThrow('Stripe unavailable');

      const failedUpdate = mockPool.query.mock.calls[mockPool.query.mock.calls.length - 1];
      expect(failedUpdate[0]).toMatch(/UPDATE settlement_runs/);
      expect(failedUpdate[0]).toMatch(/status = 'FAILED'/);
      expect(failedUpdate[1]).toContain('Stripe unavailable');
      expect(failedUpdate[1]).toContain('run-err');
    });

    it('should re-throw the error for BullMQ retry', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no existing run
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'run-retry' }] }); // INSERT
      mockStripeProvider.captureFunds = jest
        .fn()
        .mockRejectedValue(new Error('Network timeout'));
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE FAILED

      const job = makeJob({
        contractId: 'contract-retry',
        outcome: 'FAIL',
        paymentIntentId: 'pi_retry',
        amountCents: 2000,
      });

      await expect(callProcess(worker, job)).rejects.toThrow('Network timeout');
    });

    it('should update to FAILED when provider returns failure status', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no existing run
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'run-provfail' }] }); // INSERT
      mockStripeProvider.releaseFunds = jest.fn().mockResolvedValue({
        status: PayoutStatus.FAILED,
        error: 'Card declined',
      });
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE FAILED

      const job = makeJob({
        contractId: 'contract-provfail',
        outcome: 'PASS',
        paymentIntentId: 'pi_pf',
        amountCents: 3500,
      });

      await expect(callProcess(worker, job)).rejects.toThrow();

      const failedUpdate = mockPool.query.mock.calls[mockPool.query.mock.calls.length - 1];
      expect(failedUpdate[0]).toMatch(/status = 'FAILED'/);
    });

    it('should not call finalizeLedger or TruthLog when Stripe fails', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no existing run
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'run-nofin' }] }); // INSERT
      mockStripeProvider.releaseFunds = jest
        .fn()
        .mockRejectedValue(new Error('Stripe error'));
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE FAILED

      const job = makeJob({
        contractId: 'contract-nofin',
        outcome: 'PASS',
        paymentIntentId: 'pi_nofin',
        amountCents: 1500,
      });

      await expect(callProcess(worker, job)).rejects.toThrow();

      expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
    });
  });

  // ─── finalizeLedger: ledger transaction correctness ───────────────

  describe('finalizeLedger', () => {
    it('should record escrow→user transaction for PASS outcome', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no existing run
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'run-ledger-pass' }] }); // INSERT
      mockStripeProvider.releaseFunds = jest.fn().mockResolvedValue(successResult);
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          user_id: 'user-x',
          account_id: 'acct-user-x',
          escrow_account_id: 'acct-escrow-sys',
          revenue_account_id: 'acct-rev-sys',
        }],
      }); // finalizeLedger contract lookup
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE SUCCESS

      const job = makeJob({
        contractId: 'contract-ledger-pass',
        outcome: 'PASS',
        paymentIntentId: 'pi_lp',
        amountCents: 8000,
      });

      await callProcess(worker, job);

      expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
        'acct-escrow-sys',   // debit: escrow
        'acct-user-x',       // credit: user
        8000,
        'contract-ledger-pass',
        { type: 'REAL_MONEY_SETTLEMENT_RELEASE', outcome: 'PASS' },
      );
    });

    it('should record escrow→revenue transaction for FAIL outcome', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no existing run
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'run-ledger-fail' }] }); // INSERT
      mockStripeProvider.captureFunds = jest.fn().mockResolvedValue(successResult);
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          user_id: 'user-y',
          account_id: 'acct-user-y',
          escrow_account_id: 'acct-escrow-sys',
          revenue_account_id: 'acct-rev-sys',
        }],
      }); // finalizeLedger contract lookup
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE SUCCESS

      const job = makeJob({
        contractId: 'contract-ledger-fail',
        outcome: 'FAIL',
        paymentIntentId: 'pi_lf',
        amountCents: 11000,
      });

      await callProcess(worker, job);

      expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
        'acct-escrow-sys',   // debit: escrow
        'acct-rev-sys',      // credit: revenue
        11000,
        'contract-ledger-fail',
        { type: 'REAL_MONEY_SETTLEMENT_CAPTURE', outcome: 'FAIL' },
      );
    });

    it('should throw if contract is not found during ledger finalization', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no existing run
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'run-missing' }] }); // INSERT
      mockStripeProvider.releaseFunds = jest.fn().mockResolvedValue(successResult);
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // finalizeLedger → no contract found
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE FAILED

      const job = makeJob({
        contractId: 'contract-missing',
        outcome: 'PASS',
        paymentIntentId: 'pi_miss',
        amountCents: 5000,
      });

      await expect(callProcess(worker, job)).rejects.toThrow(
        /contract-missing.*not found/i,
      );
    });
  });
});
