import { AuthGuard } from './auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const DEV_SECRET = 'styx-dev-secret-do-not-use-in-production'; // allow-secret

function createMockContext(input?: {
  authHeader?: string;
  cookie?: string;
  method?: string;
  extraHeaders?: Record<string, string>;
}): ExecutionContext {
  const request: any = {
    method: input?.method || 'GET',
    headers: {
      authorization: input?.authHeader,
      cookie: input?.cookie,
      ...(input?.extraHeaders || {}),
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
    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject requests with empty Bearer token', () => {
    const context = createMockContext({ authHeader: 'Bearer ' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject requests with invalid token', () => {
    const context = createMockContext({ authHeader: 'Bearer invalid-garbage-token' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should NOT accept any hardcoded dev mock token', () => {
    // Verify that the old dev mock token is rejected (security regression test)
    const context = createMockContext({ authHeader: 'Bearer dev-mock-jwt-token-alpha-omega' }); // allow-secret
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should accept a valid JWT and attach user from payload', () => {
    const token = jwt.sign( // allow-secret
      { sub: 'user-uuid-123', email: 'alice@styx.protocol' },
      DEV_SECRET,
      { expiresIn: '1h' },
    );

    const context = createMockContext({ authHeader: `Bearer ${token}` });
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

    const context = createMockContext({ authHeader: `Bearer ${token}` });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject a JWT signed with wrong secret', () => {
    const token = jwt.sign( // allow-secret
      { sub: 'user-uuid-123', email: 'alice@styx.protocol' },
      'wrong-secret-key',
      { expiresIn: '1h' },
    );

    const context = createMockContext({ authHeader: `Bearer ${token}` });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject non-Bearer auth schemes', () => {
    const context = createMockContext({ authHeader: 'Basic dXNlcjpwYXNz' });
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
    const context = createMockContext({ authHeader: `Bearer ${token}` });

    // getJwtSecret() should throw because JWT_SECRET is missing in production
    expect(() => guard.canActivate(context)).toThrow('JWT_SECRET must be set in production');

    process.env.NODE_ENV = originalEnv;
    if (originalSecret) process.env.JWT_SECRET = originalSecret;
  });

  it('should accept cookie-based JWT on safe requests', () => {
    const token = jwt.sign(
      { sub: 'cookie-user-1', email: 'cookie@styx.protocol' },
      DEV_SECRET,
      { expiresIn: '1h' },
    );

    const context = createMockContext({
      cookie: `styx_auth_token=${encodeURIComponent(token)}`,
      method: 'GET',
    });

    expect(guard.canActivate(context)).toBe(true);
    const request = context.switchToHttp().getRequest() as any;
    expect(request.user.id).toBe('cookie-user-1');
    expect(request.authSource).toBe('cookie');
  });

  it('should reject mutating cookie-authenticated requests without CSRF token', () => {
    const token = jwt.sign(
      { sub: 'cookie-user-2', email: 'cookie2@styx.protocol' },
      DEV_SECRET,
      { expiresIn: '1h' },
    );

    const context = createMockContext({
      cookie: `styx_auth_token=${encodeURIComponent(token)}; styx_csrf_token=abc123`,
      method: 'POST',
    });

    expect(() => guard.canActivate(context)).toThrow('Missing or invalid CSRF token');
  });

  it('should allow mutating cookie-authenticated requests with matching CSRF token', () => {
    const token = jwt.sign(
      { sub: 'cookie-user-3', email: 'cookie3@styx.protocol' },
      DEV_SECRET,
      { expiresIn: '1h' },
    );

    const context = createMockContext({
      cookie: `styx_auth_token=${encodeURIComponent(token)}; styx_csrf_token=csrf-xyz`,
      method: 'PATCH',
      extraHeaders: { 'x-csrf-token': 'csrf-xyz' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
