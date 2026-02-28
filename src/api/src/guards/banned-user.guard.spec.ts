import { ForbiddenException } from '@nestjs/common';
import { BannedUserGuard } from './banned-user.guard';

describe('BannedUserGuard', () => {
  let guard: BannedUserGuard;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    guard = new BannedUserGuard(mockPool as any);
  });

  function createContext(user?: { id?: string; sub?: string } | null) {
    const hasUser = user !== null && user !== undefined;
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: hasUser ? user : undefined,
        }),
      }),
    } as any;
  }

  it('should allow request when no authenticated user is present', async () => {
    const result = await guard.canActivate(createContext(null));
    expect(result).toBe(true);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('should allow request when user has no id or sub', async () => {
    const result = await guard.canActivate(createContext({}));
    expect(result).toBe(true);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('should allow active user (using id)', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ status: 'ACTIVE' }] });
    const result = await guard.canActivate(createContext({ id: 'user-1' }));
    expect(result).toBe(true);
    expect(mockPool.query).toHaveBeenCalledWith(
      'SELECT status FROM users WHERE id = $1',
      ['user-1'],
    );
  });

  it('should allow active user (using sub fallback)', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ status: 'ACTIVE' }] });
    const result = await guard.canActivate(createContext({ sub: 'user-2' }));
    expect(result).toBe(true);
    expect(mockPool.query).toHaveBeenCalledWith(
      'SELECT status FROM users WHERE id = $1',
      ['user-2'],
    );
  });

  it('should throw ForbiddenException for banned user', async () => {
    mockPool.query.mockResolvedValue({ rows: [{ status: 'BANNED' }] });
    await expect(guard.canActivate(createContext({ id: 'banned-user' }))).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(createContext({ id: 'banned-user' }))).rejects.toThrow(
      /permanently suspended/,
    );
  });

  it('should throw ForbiddenException when user not found in DB', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    await expect(guard.canActivate(createContext({ id: 'ghost' }))).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(createContext({ id: 'ghost' }))).rejects.toThrow(
      /not found/,
    );
  });

  it('should allow non-banned statuses other than ACTIVE', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ status: 'SUSPENDED' }] });
    const result = await guard.canActivate(createContext({ id: 'user-3' }));
    expect(result).toBe(true);
  });
});
