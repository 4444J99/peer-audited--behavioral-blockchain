import { processIAP, TICKET_PRICE_BASE } from './billing';

describe('processIAP', () => {
  let mockPool: { query: jest.Mock };
  let mockStripe: { holdStake: jest.Mock; captureStake: jest.Mock };
  let mockLedger: { recordTransaction: jest.Mock };
  let mockTruthLog: { appendEvent: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockStripe = {
      holdStake: jest.fn(),
      captureStake: jest.fn(),
    };
    mockLedger = { recordTransaction: jest.fn() };
    mockTruthLog = { appendEvent: jest.fn() };
    jest.clearAllMocks();
  });

  it('should create a payment intent, capture it, record ledger entry, and log to truth log', async () => {
    // User lookup
    mockPool.query.mockResolvedValueOnce({
      rows: [{ stripe_customer_id: 'cus_test', account_id: 'acc-1' }],
    });

    // Stripe hold
    mockStripe.holdStake.mockResolvedValueOnce({ id: 'pi_test_123' });
    mockStripe.captureStake.mockResolvedValueOnce(undefined);

    // Revenue account lookup
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'acc-revenue' }],
    });

    // Ledger record
    mockLedger.recordTransaction.mockResolvedValueOnce(undefined);

    // TruthLog
    mockTruthLog.appendEvent.mockResolvedValueOnce(undefined);

    const result = await processIAP(
      mockPool as any,
      mockStripe as any,
      mockLedger as any,
      mockTruthLog as any,
      'user-1',
      'contract-1',
    );

    expect(result).toEqual({
      paymentIntentId: 'pi_test_123',
      amount: TICKET_PRICE_BASE,
    });

    expect(mockStripe.holdStake).toHaveBeenCalledWith('cus_test', TICKET_PRICE_BASE, 'contract-1');
    expect(mockStripe.captureStake).toHaveBeenCalledWith('pi_test_123');
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acc-1',
      'acc-revenue',
      TICKET_PRICE_BASE,
      'contract-1',
      { type: 'TICKET_PURCHASE', userId: 'user-1' },
    );
    expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('TICKET_PURCHASED', {
      userId: 'user-1',
      contractId: 'contract-1',
      amount: TICKET_PRICE_BASE,
      paymentIntentId: 'pi_test_123',
    });
  });

  it('should throw when user is not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await expect(
      processIAP(mockPool as any, mockStripe as any, mockLedger as any, mockTruthLog as any, 'no-user', 'c-1'),
    ).rejects.toThrow('User no-user not found');
  });

  it('should throw when user has no stripe customer id', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ stripe_customer_id: null, account_id: 'acc-1' }],
    });

    await expect(
      processIAP(mockPool as any, mockStripe as any, mockLedger as any, mockTruthLog as any, 'user-no-stripe', 'c-1'),
    ).rejects.toThrow('User has no payment method on file');
  });

  it('should still succeed when user has no ledger account (no account_id)', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ stripe_customer_id: 'cus_test', account_id: null }],
    });

    mockStripe.holdStake.mockResolvedValueOnce({ id: 'pi_no_acc' });
    mockStripe.captureStake.mockResolvedValueOnce(undefined);
    mockTruthLog.appendEvent.mockResolvedValueOnce(undefined);

    const result = await processIAP(
      mockPool as any,
      mockStripe as any,
      mockLedger as any,
      mockTruthLog as any,
      'user-no-acc',
      'c-2',
    );

    expect(result.paymentIntentId).toBe('pi_no_acc');
    // Ledger should NOT have been called since account_id is null
    expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
  });
});
