import { RoleGuard, ROLES_KEY } from './role.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let mockReflector: Reflector;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;
    mockPool = { query: jest.fn() };
    guard = new RoleGuard(mockReflector, mockPool as any);
  });

  function createContext(user: { id: string } | null, handler = jest.fn(), cls = jest.fn()) {
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
  });

  it('should allow access when empty roles array', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue([]);

    const result = await guard.canActivate(createContext({ id: 'u1' }));

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user has no id', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);

    await expect(guard.canActivate(createContext(null))).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user not found in DB', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await expect(guard.canActivate(createContext({ id: 'u-missing' }))).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user role does not match', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    mockPool.query.mockResolvedValueOnce({ rows: [{ role: 'USER' }] });

    await expect(guard.canActivate(createContext({ id: 'u-regular' }))).rejects.toThrow(
      /Role USER is not authorized/,
    );
  });

  it('should allow access when user role matches', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    mockPool.query.mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] });

    const result = await guard.canActivate(createContext({ id: 'u-admin' }));

    expect(result).toBe(true);
  });

  it('should allow access when user role matches one of multiple required roles', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN', 'FURY']);
    mockPool.query.mockResolvedValueOnce({ rows: [{ role: 'FURY' }] });

    const result = await guard.canActivate(createContext({ id: 'u-fury' }));

    expect(result).toBe(true);
  });

  it('should default to USER role when role field is null', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    mockPool.query.mockResolvedValueOnce({ rows: [{ role: null }] });

    await expect(guard.canActivate(createContext({ id: 'u-null-role' }))).rejects.toThrow(
      /Role USER is not authorized/,
    );
  });
});
