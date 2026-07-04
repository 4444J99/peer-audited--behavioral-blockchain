import { AuthGuard } from './auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { deriveCsrfToken } from '../src/modules/auth/auth.service';

// Tokens must be signed with the same secret the guard verifies against. The
// guard resolves it via getJwtSecret() which reads process.env.JWT_SECRET
// (set for all tests by jest.setup.cjs), so sign with that value.
const JWT_SECRET = process.env.JWT_SECRET as string; // allow-secret

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
      JWT_SECRET,
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
      JWT_SECRET,
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

  it('should throw if JWT_SECRET is not set (in any environment)', () => {
    const originalSecret = process.env.JWT_SECRET;

    // getJwtSecret() now enforces the secret in ALL environments, not just
    // production, with no insecure hardcoded fallback.
    delete process.env.JWT_SECRET;

    try {
      const token = jwt.sign( // allow-secret
        { sub: 'user-uuid-123', email: 'alice@styx.protocol' },
        'any-secret',
        { expiresIn: '1h' },
      );
      const context = createMockContext({ authHeader: `Bearer ${token}` });

      // getJwtSecret() should throw because JWT_SECRET is missing
      expect(() => guard.canActivate(context)).toThrow('JWT_SECRET must be set');
    } finally {
      // Always restore so subsequent tests in this file keep a valid secret.
      if (originalSecret !== undefined) process.env.JWT_SECRET = originalSecret;
    }
  });

  it('should accept cookie-based JWT on safe requests', () => {
    const token = jwt.sign(
      { sub: 'cookie-user-1', email: 'cookie@styx.protocol' },
      JWT_SECRET,
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
      JWT_SECRET,
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
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    // The CSRF token is now bound to the session: the x-csrf-token header must
    // equal deriveCsrfToken(sessionToken) (an HMAC over the access token).
    const csrf = deriveCsrfToken(token);

    const context = createMockContext({
      cookie: `styx_auth_token=${encodeURIComponent(token)}`,
      method: 'PATCH',
      extraHeaders: { 'x-csrf-token': csrf },
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
