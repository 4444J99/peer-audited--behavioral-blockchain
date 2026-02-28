import { FuryRouterWorker } from './fury-router.worker';

// Mock bullmq so onModuleInit doesn't start a real worker
jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation((_name: string, processor: any, _opts: any) => ({
    on: jest.fn(),
    close: jest.fn(),
    processor,
  })),
  Job: jest.fn(),
}));

jest.mock('../../config/queue.config', () => ({
  FURY_ROUTER_QUEUE_NAME: 'test-fury-queue',
  getDefaultQueueOptions: () => ({
    connection: { host: 'localhost', port: 6379 },
  }),
}));

describe('FuryRouterWorker', () => {
  let worker: FuryRouterWorker;
  let mockPool: {
    connect: jest.Mock;
  };
  let mockClient: {
    query: jest.Mock;
    release: jest.Mock;
  };

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
    };
    worker = new FuryRouterWorker(mockPool as any);
    worker.onModuleInit();
  });

  async function processJob(data: {
    proofId: string;
    submitterUserId: string;
    requiredReviewers: number;
    dispatchedAt: string;
  }) {
    // Access the private processJob method via the worker's processor
    const workerInstance = worker as any;
    return workerInstance.processJob({ data } as any);
  }

  it('should route a proof to eligible furies and update proof status', async () => {
    // BEGIN
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 'fury-1' }, { id: 'fury-2' }, { id: 'fury-3' }] }) // SELECT eligible
      .mockResolvedValueOnce(undefined) // INSERT assignment 1
      .mockResolvedValueOnce(undefined) // INSERT assignment 2
      .mockResolvedValueOnce(undefined) // INSERT assignment 3
      .mockResolvedValueOnce(undefined) // UPDATE proof status
      .mockResolvedValueOnce(undefined); // COMMIT

    await processJob({
      proofId: 'proof-1',
      submitterUserId: 'user-1',
      requiredReviewers: 3,
      dispatchedAt: new Date().toISOString(),
    });

    // Verify BEGIN/COMMIT
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');

    // Verify eligible fury query excludes submitter
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id != $1'),
      ['user-1', 3],
    );

    // Verify assignments created
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO fury_assignments'),
      ['proof-1', 'fury-1'],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO fury_assignments'),
      ['proof-1', 'fury-2'],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO fury_assignments'),
      ['proof-1', 'fury-3'],
    );

    // Verify proof status updated
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'UNDER_REVIEW'"),
      ['proof-1'],
    );

    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should proceed with fewer furies than required when pool is small', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 'fury-1' }] }) // Only 1 eligible
      .mockResolvedValueOnce(undefined) // INSERT assignment
      .mockResolvedValueOnce(undefined) // UPDATE proof status
      .mockResolvedValueOnce(undefined); // COMMIT

    await processJob({
      proofId: 'proof-2',
      submitterUserId: 'user-2',
      requiredReviewers: 3,
      dispatchedAt: new Date().toISOString(),
    });

    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should throw and rollback when no eligible furies exist', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // No eligible furies

    await expect(
      processJob({
        proofId: 'proof-3',
        submitterUserId: 'user-3',
        requiredReviewers: 3,
        dispatchedAt: new Date().toISOString(),
      }),
    ).rejects.toThrow('No eligible Furies available');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should rollback on database error during assignment creation', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 'fury-1' }] }) // Eligible
      .mockRejectedValueOnce(new Error('DB write error')); // INSERT fails

    await expect(
      processJob({
        proofId: 'proof-4',
        submitterUserId: 'user-4',
        requiredReviewers: 1,
        dispatchedAt: new Date().toISOString(),
      }),
    ).rejects.toThrow('DB write error');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});
