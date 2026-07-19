import { RoleGuard } from './role.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let mockReflector: Reflector;
  let mockPool: Pool;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;
    mockPool = {
      query: jest.fn(),
    } as unknown as Pool;
    guard = new RoleGuard(mockReflector, mockPool);
  });

  function createContext(user: { id: string; role?: string } | null, handler = jest.fn(), cls = jest.fn()) {
    return {
      getHandler: () => handler,
      getClass: () => cls,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  it('should allow access when no roles are required', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    const result = await guard.canActivate(createContext({ id: 'u1' }));

    expect(result).toBe(true);
    // No role required — no DB round-trip needed.
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('should allow access when empty roles array', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue([]);

    const result = await guard.canActivate(createContext({ id: 'u1' }));

    expect(result).toBe(true);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user has no id (fail closed)', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);

    await expect(guard.canActivate(createContext(null))).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when the user no longer exists', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    await expect(guard.canActivate(createContext({ id: 'gone' }))).rejects.toThrow(/User not found/);
  });

  it('should throw ForbiddenException when DB role does not match', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ role: 'USER', status: 'ACTIVE' }] });

    await expect(guard.canActivate(createContext({ id: 'u-regular', role: 'USER' }))).rejects.toThrow(
      /Role USER is not authorized/,
    );
  });

  it('should allow access when DB role matches', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ role: 'ADMIN', status: 'ACTIVE' }] });

    const result = await guard.canActivate(createContext({ id: 'u-admin', role: 'ADMIN' }));

    expect(result).toBe(true);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT role, status FROM users WHERE id = $1'),
      ['u-admin'],
    );
  });

  it('should allow access when DB role matches one of multiple required roles', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN', 'FURY']);
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ role: 'FURY', status: 'ACTIVE' }] });

    const result = await guard.canActivate(createContext({ id: 'u-fury', role: 'FURY' }));

    expect(result).toBe(true);
  });

  it('should reject a stale JWT whose claimed role was demoted in the DB', async () => {
    // Token still claims FURY, but fury.worker demoted the user to USER. The guard
    // must honor the CURRENT DB role, not the stale token claim.
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['FURY']);
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ role: 'USER', status: 'ACTIVE' }] });

    await expect(guard.canActivate(createContext({ id: 'u-demoted', role: 'FURY' }))).rejects.toThrow(
      /Role USER is not authorized/,
    );
  });

  it('should reject a banned user even when the role would otherwise match', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ role: 'ADMIN', status: 'BANNED' }] });

    await expect(guard.canActivate(createContext({ id: 'u-banned', role: 'ADMIN' }))).rejects.toThrow(
      /permanently suspended/,
    );
  });

  it('should default to USER role when DB role field is absent', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ role: null, status: 'ACTIVE' }] });

    await expect(guard.canActivate(createContext({ id: 'u-null-role' }))).rejects.toThrow(
      /Role USER is not authorized/,
    );
  });
});
