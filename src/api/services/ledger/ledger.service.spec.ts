import { LedgerService } from './ledger.service';
import { Pool } from 'pg';

// Create a mock Pool object with jest implementations
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  connect: jest.fn().mockResolvedValue(mockClient),
} as unknown as Pool;

describe('LedgerService', () => {
  let service: LedgerService;

  beforeEach(() => {
    service = new LedgerService(mockPool);
    jest.clearAllMocks();
  });

  it('should successfully record a transaction with BEGIN and COMMIT', async () => {
    // Mock successful insertion returning an ID
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 'mock-uuid-123' }] }) // INSERT
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const resultId = await service.recordTransaction('account-A', 'account-B', 50.0);

    expect(resultId).toBe('mock-uuid-123');
    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(mockClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should execute a ROLLBACK on error and re-throw', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockRejectedValueOnce(new Error('Simulated Database Error')); // INSERT fails

    await expect(service.recordTransaction('account-A', 'account-B', 50.0))
      .rejects
      .toThrow('Simulated Database Error');

    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(mockClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should reject non-positive amounts', async () => {
    await expect(service.recordTransaction('account-A', 'account-B', -10))
      .rejects
      .toThrow('Transaction amount must be strictly positive');
    
    // Connect should not even be called
    expect(mockPool.connect).not.toHaveBeenCalled();
  });
});
