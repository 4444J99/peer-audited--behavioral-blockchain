import { VideoProcessingWorker } from './video-processing.worker';

jest.mock('bullmq', () => {
  const mockWorkerOn = jest.fn();
  const MockWorker = jest.fn(() => ({
    on: mockWorkerOn,
  }));
  return { Worker: MockWorker };
});

const mockPool = { query: jest.fn() };

describe('VideoProcessingWorker', () => {
  let worker: VideoProcessingWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    worker = new VideoProcessingWorker(mockPool as any);
  });

  it('is defined and initializable', () => {
    expect(worker).toBeDefined();
  });

  it('initializes in onModuleInit', () => {
    worker.onModuleInit();
    // Worker constructor was called with the queue name
    const { Worker } = require('bullmq');
    expect(Worker).toHaveBeenCalledWith(
      'VIDEO_PROCESSING_QUEUE',
      expect.any(Function),
      expect.objectContaining({ concurrency: 2 }),
    );
  });
});
