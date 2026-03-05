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
  let mockPool: { query: jest.Mock };
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

  const callProcess = (w: SettlementWorker, job: Job) => (w as any).process(job);

  it('should calculate deterministic quote and top up bounty pool on capture', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [] }) // existing
      .mockResolvedValueOnce({ rows: [{ id: 'run-1' }] }) // insert run
      .mockResolvedValueOnce(makeContractRow()) // finalizeLedger
      .mockResolvedValueOnce({ rows: [] }); // update success

    mockStripeProvider.captureFunds.mockResolvedValue(successResult);

    const job = makeJob({
      contractId: 'c-1',
      outcome: 'FAIL',
      paymentIntentId: 'pi_1',
      amountCents: 10000,
    });

    await callProcess(worker, job);

    // 1. Check quote in insert
    const insertCall = mockPool.query.mock.calls[1];
    const quote = JSON.parse(insertCall[1][4]);
    expect(quote.bountyPoolCents).toBe(2000);

    // 2. Check ledger calls (capture + bounty topup)
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-escrow',
      'acct-revenue',
      10000,
      'c-1',
      expect.objectContaining({ type: 'REAL_MONEY_SETTLEMENT_CAPTURE' })
    );

    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-revenue',
      'acct-bounty',
      2000,
      'c-1',
      expect.objectContaining({ type: 'BOUNTY_POOL_TOPUP' })
    );
  });

  it('should override actual action to RELEASE if dispositionMode is REFUND', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'run-2' }] })
      .mockResolvedValueOnce(makeContractRow())
      .mockResolvedValueOnce({ rows: [] });

    mockStripeProvider.releaseFunds.mockResolvedValue(successResult);

    const job = makeJob({
      contractId: 'c-2',
      outcome: 'FAIL', // User failed but...
      paymentIntentId: 'pi_2',
      amountCents: 5000,
      dispositionMode: 'REFUND' // ...restricted jurisdiction forces refund
    });

    await callProcess(worker, job);

    expect(mockStripeProvider.releaseFunds).toHaveBeenCalled();
    expect(mockStripeProvider.captureFunds).not.toHaveBeenCalled();
    
    // Ledger should reflect refund
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-escrow',
      'acct-user-1',
      5000,
      'c-2',
      expect.objectContaining({ type: 'REAL_MONEY_SETTLEMENT_RELEASE' })
    );
  });
});