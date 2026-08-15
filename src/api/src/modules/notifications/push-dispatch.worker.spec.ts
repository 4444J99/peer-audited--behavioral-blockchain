import { PushDispatchWorker } from './push-dispatch.worker';

jest.mock('bullmq', () => {
  const mockWorkerOn = jest.fn();
  const MockWorker = jest.fn(() => ({ on: mockWorkerOn }));
  return { Worker: MockWorker };
});

describe('PushDispatchWorker', () => {
  let worker: PushDispatchWorker;
  let mockPushTokens: any;
  let mockProvider: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPushTokens = {
      getActiveTokens: jest.fn(),
      markDelivery: jest.fn().mockResolvedValue(undefined),
      unregisterToken: jest.fn().mockResolvedValue(undefined),
    };
    mockProvider = {
      name: 'expo',
      send: jest.fn(),
    };
    worker = new PushDispatchWorker(mockPushTokens, mockProvider);
  });

  it('is defined', () => {
    expect(worker).toBeDefined();
  });

  it('records the send ticket so the receipt sweep can resolve the delivery', async () => {
    mockPushTokens.getActiveTokens.mockResolvedValue([{ id: 'token-1', token: 'tok-1', platform: 'ios' }]); // allow-secret
    mockProvider.send.mockResolvedValue({ status: 'SENT', providerResult: 'ok', ticketId: 'ticket-abc' });

    await (worker as any).process({
      data: { userId: 'user-1', type: 'REMINDER', title: 'Title', body: 'Body' },
    });

    expect(mockPushTokens.markDelivery).toHaveBeenCalledWith(
      'token-1', 'user-1', 'REMINDER', 'Title', 'Body', null,
      'expo', 'SENT', 'ok', undefined, 'ticket-abc',
    );
  });

  it('initializes in onModuleInit', () => {
    worker.onModuleInit();
    const { Worker } = require('bullmq');
    expect(Worker).toHaveBeenCalledWith(
      'PUSH_DISPATCH_QUEUE',
      expect.any(Function),
      expect.objectContaining({ concurrency: 4 }),
    );
  });
});
