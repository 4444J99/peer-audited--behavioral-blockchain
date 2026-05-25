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

  it('should deny (fail closed) when no authenticated user is present', async () => {
    await expect(guard.canActivate(createContext(null))).rejects.toThrow(ForbiddenException);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('should deny (fail closed) when user has no id', async () => {
    await expect(guard.canActivate(createContext({}))).rejects.toThrow(ForbiddenException);
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
