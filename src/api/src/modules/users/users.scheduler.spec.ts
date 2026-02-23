import { UsersScheduler } from './users.scheduler';
import { Pool } from 'pg';

describe('UsersScheduler', () => {
  let scheduler: UsersScheduler;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    scheduler = new UsersScheduler(mockPool as unknown as Pool);
    jest.clearAllMocks();
  });

  it('should decay integrity for inactive users', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 5 });

    await scheduler.handleMonthlyDecay();

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    const sql = mockPool.query.mock.calls[0][0];
    expect(sql).toContain('integrity_score - 1');
    expect(sql).toContain('GREATEST(0');
    expect(sql).toContain('NOT IN');
    expect(sql).toContain('30 days');
  });

  it('should only target active users with positive scores', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

    await scheduler.handleMonthlyDecay();

    const sql = mockPool.query.mock.calls[0][0];
    expect(sql).toContain('integrity_score > 0');
    expect(sql).toContain("status = 'ACTIVE'");
  });

  it('should handle zero affected rows gracefully', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

    await expect(scheduler.handleMonthlyDecay()).resolves.not.toThrow();
  });
});
