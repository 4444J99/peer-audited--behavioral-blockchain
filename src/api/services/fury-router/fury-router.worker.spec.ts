import { FuryRouterWorker } from './fury-router.worker';

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
  let mockPool: { connect: jest.Mock };
  let mockClient: { query: jest.Mock; release: jest.Mock };

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

  async function processJob(data: any) {
    const workerInstance = worker as any;
    return workerInstance.processJob({ data } as any);
  }

  it('should route with isolation (geographic, social, corporate, partner)', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ last_known_state: 'NY', social_guild_id: 'guild-1', enterprise_id: 'corp-1' }] }) // Submitter meta
      .mockResolvedValueOnce({ rows: [{ partner_user_id: 'partner-1' }] }) // Partners
      .mockResolvedValueOnce({ rows: [{ id: 'fury-1' }, { id: 'fury-2' }] }) // Eligible Furies
      .mockResolvedValueOnce(undefined) // INSERT 1
      .mockResolvedValueOnce(undefined) // INSERT 2
      .mockResolvedValueOnce(undefined) // UPDATE proof
      .mockResolvedValueOnce(undefined); // COMMIT

    await processJob({
      proofId: 'proof-1',
      submitterUserId: 'user-1',
      requiredReviewers: 2,
    });

    // Verify isolation parameters in the eligible query
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('last_known_state != '),
      ['user-1', 'NY', 'guild-1', 'corp-1', ['partner-1'], 2]
    );

    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

  it('should fallback to default values for isolation if submitter has no metadata', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ last_known_state: null, social_guild_id: null, enterprise_id: null }] })
      .mockResolvedValueOnce({ rows: [] }) // No partners
      .mockResolvedValueOnce({ rows: [{ id: 'fury-1' }] })
      .mockResolvedValueOnce(undefined) // INSERT
      .mockResolvedValueOnce(undefined) // UPDATE
      .mockResolvedValueOnce(undefined); // COMMIT

    await processJob({
      proofId: 'proof-2',
      submitterUserId: 'user-2',
      requiredReviewers: 1,
    });

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('last_known_state != '),
      ['user-2', 'UNKNOWN', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', ['00000000-0000-0000-0000-000000000000'], 1]
    );
  });
});