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

  it('should NOT accept any hardcoded dev mock token', () => {
    // Verify that the old dev mock token is rejected (security regression test)
    const context = createMockContext('Bearer dev-mock-jwt-token-alpha-omega'); // allow-secret
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
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

  it('should throw in production if JWT_SECRET is not set', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;

    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    const token = jwt.sign( // allow-secret
      { sub: 'user-uuid-123', email: 'alice@styx.protocol' },
      'any-secret',
      { expiresIn: '1h' },
    );
    const context = createMockContext(`Bearer ${token}`);

    // getJwtSecret() should throw because JWT_SECRET is missing in production
    expect(() => guard.canActivate(context)).toThrow('JWT_SECRET must be set in production');

    process.env.NODE_ENV = originalEnv;
    if (originalSecret) process.env.JWT_SECRET = originalSecret;
  });
});
