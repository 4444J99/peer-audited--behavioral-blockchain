import { TruthLogService } from './truth-log.service';
import { Pool } from 'pg';
import { createHash } from 'crypto';

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  connect: jest.fn().mockResolvedValue(mockClient),
} as unknown as Pool;

describe('TruthLogService', () => {
  let service: TruthLogService;

  beforeEach(() => {
    service = new TruthLogService(mockPool);
    jest.clearAllMocks();
  });

  it('should append event using GENESIS_HASH if table is empty', async () => {
    // Mock the SELECT query to return no rows (empty log)
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT
      .mockResolvedValueOnce({ rows: [{ id: 'new-log-1' }] }) // INSERT
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const payload = { action: 'start_habit' };
    const resultId = await service.appendEvent('TEST_EVENT', payload);

    expect(resultId).toBe('new-log-1');

    // Calculate expected hash
    const expectedHash = createHash('sha256')
      .update(`GENESIS_HASH${JSON.stringify(payload)}`)
      .digest('hex');

    // Verify INSERT statement arguments
    const insertCallArgs = mockClient.query.mock.calls[2];
    expect(insertCallArgs[0]).toContain('INSERT INTO event_log');
    expect(insertCallArgs[1][2]).toBe('GENESIS_HASH'); // previous hash
    expect(insertCallArgs[1][3]).toBe(expectedHash); // current hash
  });

  it('should append event chaining the previous hash correctly', async () => {
    // Mock the SELECT query to return an existing hash
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ current_hash: 'abc123oldhash' }] }) // SELECT
      .mockResolvedValueOnce({ rows: [{ id: 'new-log-2' }] }) // INSERT
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const payload = { action: 'complete_habit' };
    await service.appendEvent('TEST_EVENT', payload);

    const expectedHash = createHash('sha256')
      .update(`abc123oldhash${JSON.stringify(payload)}`)
      .digest('hex');

    const insertCallArgs = mockClient.query.mock.calls[2];
    expect(insertCallArgs[1][2]).toBe('abc123oldhash');
    expect(insertCallArgs[1][3]).toBe(expectedHash);
  });
});
