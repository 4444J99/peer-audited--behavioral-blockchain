import { AuthGuard } from './auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const DEV_SECRET = 'styx-dev-secret-do-not-use-in-production'; // allow-secret

function createMockContext(authHeader?: string): ExecutionContext {
  const request: any = {
    headers: {
      authorization: authHeader,
    },
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard();
  });

  it('should reject requests with no Authorization header', () => {
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject requests with empty Bearer token', () => {
    const context = createMockContext('Bearer ');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject requests with invalid token', () => {
    const context = createMockContext('Bearer invalid-garbage-token');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should accept the dev mock token and attach demo user', () => {
    const context = createMockContext('Bearer dev-mock-jwt-token-alpha-omega'); // allow-secret
    const result = guard.canActivate(context);

    expect(result).toBe(true);

    const request = context.switchToHttp().getRequest() as any;
    expect(request.user.id).toBe('d0000000-0000-0000-0000-000000000001');
    expect(request.user.email).toBe('demo@styx.protocol');
  });

  it('should accept a valid JWT and attach user from payload', () => {
    const token = jwt.sign( // allow-secret
      { sub: 'user-uuid-123', email: 'alice@styx.protocol' },
      DEV_SECRET,
      { expiresIn: '1h' },
    );

    const context = createMockContext(`Bearer ${token}`);
    const result = guard.canActivate(context);

    expect(result).toBe(true);

    const request = context.switchToHttp().getRequest() as any;
    expect(request.user.id).toBe('user-uuid-123');
    expect(request.user.email).toBe('alice@styx.protocol');
  });

  it('should reject an expired JWT', () => {
    const token = jwt.sign( // allow-secret
      { sub: 'user-uuid-123', email: 'alice@styx.protocol' },
      DEV_SECRET,
      { expiresIn: '-1s' }, // already expired
    );

    const context = createMockContext(`Bearer ${token}`);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject a JWT signed with wrong secret', () => {
    const token = jwt.sign( // allow-secret
      { sub: 'user-uuid-123', email: 'alice@styx.protocol' },
      'wrong-secret-key',
      { expiresIn: '1h' },
    );

    const context = createMockContext(`Bearer ${token}`);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject non-Bearer auth schemes', () => {
    const context = createMockContext('Basic dXNlcjpwYXNz');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
