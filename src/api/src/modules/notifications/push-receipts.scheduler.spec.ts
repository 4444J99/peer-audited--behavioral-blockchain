import { PushReceiptsScheduler } from './push-receipts.scheduler';

describe('PushReceiptsScheduler', () => {
  let scheduler: PushReceiptsScheduler;
  let mockPushTokens: any;
  let mockProvider: any;

  const delivery = (overrides: Record<string, unknown> = {}) => ({
    id: 'delivery-1',
    push_token_id: 'token-1',
    user_id: 'user-1',
    provider_ticket_id: 'ticket-1',
    receipt_attempts: 0,
    ...overrides,
  });

  beforeEach(() => {
    mockPushTokens = {
      getDeliveriesAwaitingReceipt: jest.fn().mockResolvedValue([]),
      recordReceiptOutcome: jest.fn().mockResolvedValue(undefined),
      markReceiptUnresolved: jest.fn().mockResolvedValue(undefined),
      deactivateTokenById: jest.fn().mockResolvedValue(undefined),
    };
    mockProvider = {
      name: 'expo',
      fetchReceipts: jest.fn().mockResolvedValue(new Map()),
    };
    scheduler = new PushReceiptsScheduler(mockPushTokens, mockProvider);
  });

  it('does not call the provider when nothing is awaiting a receipt', async () => {
    await scheduler.collectPushReceipts();

    expect(mockProvider.fetchReceipts).not.toHaveBeenCalled();
  });

  it('confirms a delivered ticket without touching the token', async () => {
    mockPushTokens.getDeliveriesAwaitingReceipt.mockResolvedValue([delivery()]);
    mockProvider.fetchReceipts.mockResolvedValue(
      new Map([['ticket-1', { status: 'OK' }]]),
    );

    await scheduler.collectPushReceipts();

    expect(mockProvider.fetchReceipts).toHaveBeenCalledWith(['ticket-1']);
    expect(mockPushTokens.recordReceiptOutcome).toHaveBeenCalledWith(
      'delivery-1',
      'OK',
      'SENT',
    );
    expect(mockPushTokens.deactivateTokenById).not.toHaveBeenCalled();
  });

  it('deactivates the token on DeviceNotRegistered', async () => {
    mockPushTokens.getDeliveriesAwaitingReceipt.mockResolvedValue([delivery()]);
    mockProvider.fetchReceipts.mockResolvedValue(
      new Map([[
        'ticket-1',
        {
          status: 'ERROR',
          errorCode: 'DeviceNotRegistered',
          errorMessage: 'device not registered',
        },
      ]]),
    );

    await scheduler.collectPushReceipts();

    expect(mockPushTokens.recordReceiptOutcome).toHaveBeenCalledWith(
      'delivery-1',
      'ERROR',
      'UNREGISTERED',
      'DeviceNotRegistered',
      'device not registered',
    );
    expect(mockPushTokens.deactivateTokenById).toHaveBeenCalledWith('token-1');
  });

  it('records a non-device receipt error without deactivating the token', async () => {
    mockPushTokens.getDeliveriesAwaitingReceipt.mockResolvedValue([delivery()]);
    mockProvider.fetchReceipts.mockResolvedValue(
      new Map([[
        'ticket-1',
        { status: 'ERROR', errorCode: 'MessageTooBig', errorMessage: 'too big' },
      ]]),
    );

    await scheduler.collectPushReceipts();

    expect(mockPushTokens.recordReceiptOutcome).toHaveBeenCalledWith(
      'delivery-1',
      'ERROR',
      'FAILED',
      'MessageTooBig',
      'too big',
    );
    expect(mockPushTokens.deactivateTokenById).not.toHaveBeenCalled();
  });

  it('does not deactivate on MessageRateExceeded — the device is fine', async () => {
    mockPushTokens.getDeliveriesAwaitingReceipt.mockResolvedValue([delivery()]);
    mockProvider.fetchReceipts.mockResolvedValue(
      new Map([[
        'ticket-1',
        { status: 'ERROR', errorCode: 'MessageRateExceeded' },
      ]]),
    );

    await scheduler.collectPushReceipts();

    expect(mockPushTokens.deactivateTokenById).not.toHaveBeenCalled();
  });

  it('skips deactivation when the delivery has no surviving token row', async () => {
    mockPushTokens.getDeliveriesAwaitingReceipt.mockResolvedValue([
      delivery({ push_token_id: null }),
    ]);
    mockProvider.fetchReceipts.mockResolvedValue(
      new Map([['ticket-1', { status: 'ERROR', errorCode: 'DeviceNotRegistered' }]]),
    );

    await scheduler.collectPushReceipts();

    expect(mockPushTokens.recordReceiptOutcome).toHaveBeenCalled();
    expect(mockPushTokens.deactivateTokenById).not.toHaveBeenCalled();
  });

  it('leaves an unresolved ticket pending while it is under the attempt ceiling', async () => {
    mockPushTokens.getDeliveriesAwaitingReceipt.mockResolvedValue([
      delivery({ receipt_attempts: 3 }),
    ]);

    await scheduler.collectPushReceipts();

    expect(mockPushTokens.markReceiptUnresolved).toHaveBeenCalledWith('delivery-1', false);
    expect(mockPushTokens.recordReceiptOutcome).not.toHaveBeenCalled();
  });

  it('abandons a ticket that reached the attempt ceiling', async () => {
    mockPushTokens.getDeliveriesAwaitingReceipt.mockResolvedValue([
      delivery({ receipt_attempts: 23 }),
    ]);

    await scheduler.collectPushReceipts();

    expect(mockPushTokens.markReceiptUnresolved).toHaveBeenCalledWith('delivery-1', true);
  });

  it('resolves each pending delivery independently when one write fails', async () => {
    mockPushTokens.getDeliveriesAwaitingReceipt.mockResolvedValue([
      delivery(),
      delivery({ id: 'delivery-2', provider_ticket_id: 'ticket-2', push_token_id: 'token-2' }),
    ]);
    mockProvider.fetchReceipts.mockResolvedValue(
      new Map([
        ['ticket-1', { status: 'OK' }],
        ['ticket-2', { status: 'OK' }],
      ]),
    );
    mockPushTokens.recordReceiptOutcome
      .mockRejectedValueOnce(new Error('deadlock detected'))
      .mockResolvedValueOnce(undefined);
    jest.spyOn((scheduler as any).logger, 'error').mockImplementation();

    await scheduler.collectPushReceipts();

    expect(mockPushTokens.recordReceiptOutcome).toHaveBeenCalledTimes(2);
  });

  it('returns without writing when the pending query fails', async () => {
    mockPushTokens.getDeliveriesAwaitingReceipt.mockRejectedValue(new Error('pool exhausted'));
    const errorSpy = jest.spyOn((scheduler as any).logger, 'error').mockImplementation();

    await scheduler.collectPushReceipts();

    expect(errorSpy).toHaveBeenCalled();
    expect(mockProvider.fetchReceipts).not.toHaveBeenCalled();
    expect(mockPushTokens.markReceiptUnresolved).not.toHaveBeenCalled();
  });

  it('leaves every ticket untouched when the provider lookup throws', async () => {
    mockPushTokens.getDeliveriesAwaitingReceipt.mockResolvedValue([delivery()]);
    mockProvider.fetchReceipts.mockRejectedValue(new Error('ECONNRESET'));
    jest.spyOn((scheduler as any).logger, 'error').mockImplementation();

    await scheduler.collectPushReceipts();

    expect(mockPushTokens.markReceiptUnresolved).not.toHaveBeenCalled();
    expect(mockPushTokens.recordReceiptOutcome).not.toHaveBeenCalled();
  });
});
