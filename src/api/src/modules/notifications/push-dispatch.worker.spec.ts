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
