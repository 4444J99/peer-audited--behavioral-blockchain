import { AuthGuard } from './auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { deriveApiKeyVerifier, deriveCsrfToken } from '../src/modules/auth/auth.service';

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
  const mockPool = {
    query: jest.fn(),
  };

  beforeEach(() => {
    guard = new AuthGuard();
    mockPool.query.mockReset();
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
      { sub: 'user-uuid-123', email: '[email redacted]' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    const context = createMockContext({ authHeader: `Bearer ${token}` });
    const result = guard.canActivate(context);

    expect(result).toBe(true);

    const request = context.switchToHttp().getRequest() as any;
    expect(request.user.id).toBe('user-uuid-123');
    expect(request.user.email).toBe('[email redacted]');
  });

  it('should reject an expired JWT', () => {
    const token = jwt.sign( // allow-secret
      { sub: 'user-uuid-123', email: '[email redacted]' },
      JWT_SECRET,
      { expiresIn: '-1s' }, // already expired
    );

    const context = createMockContext({ authHeader: `Bearer ${token}` });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject a JWT signed with wrong secret', () => {
    const token = jwt.sign( // allow-secret
      { sub: 'user-uuid-123', email: '[email redacted]' },
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
        { sub: 'user-uuid-123', email: '[email redacted]' },
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
      { sub: 'cookie-user-1', email: '[email redacted]' },
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
      { sub: 'cookie-user-2', email: '[email redacted]' },
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
      { sub: 'cookie-user-3', email: '[email redacted]' },
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

  it('should accept x-api-key and attach the authenticated user', async () => {
    const keyId = 'a'.repeat(24);
    const secret = 'secret_WITH-underscore'; // allow-secret
    const apiKey = `styx_live_${keyId}_${secret}`; // allow-secret
    const apiKeyGuard = new AuthGuard(undefined, mockPool as any);

    mockPool.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'api-key-db-id',
          user_id: 'user-api-1',
          key_hash: deriveApiKeyVerifier(secret),
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          revoked_at: null,
          email: 'api@styx.protocol',
          role: 'USER',
          status: 'ACTIVE',
        }],
      })
      .mockResolvedValueOnce(undefined);

    const context = createMockContext({
      extraHeaders: { 'x-api-key': apiKey },
    });

    await expect(apiKeyGuard.canActivate(context)).resolves.toBe(true);

    const request = context.switchToHttp().getRequest() as any;
    expect(request.user.id).toBe('user-api-1');
    expect(request.user.email).toBe('api@styx.protocol');
    expect(request.user.apiKeyId).toBe(keyId);
    expect(request.authSource).toBe('api_key');
    expect(mockPool.query).toHaveBeenLastCalledWith(
      expect.stringContaining('UPDATE api_keys SET last_used_at = NOW()'),
      ['api-key-db-id'],
    );
  });

  it('should accept Authorization: ApiKey as an API-key credential', async () => {
    const keyId = 'b'.repeat(24);
    const secret = 'api-key-secret'; // allow-secret
    const apiKeyGuard = new AuthGuard(undefined, mockPool as any);

    mockPool.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'api-key-db-id-2',
          user_id: 'user-api-2',
          key_hash: deriveApiKeyVerifier(secret),
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          revoked_at: null,
          email: 'api2@styx.protocol',
          role: 'ADMIN',
          status: 'ACTIVE',
        }],
      })
      .mockResolvedValueOnce(undefined);

    const context = createMockContext({
      authHeader: `ApiKey styx_live_${keyId}_${secret}`,
    });

    await expect(apiKeyGuard.canActivate(context)).resolves.toBe(true);
    const request = context.switchToHttp().getRequest() as any;
    expect(request.user.role).toBe('ADMIN');
    expect(request.authSource).toBe('api_key');
  });

  it('should reject revoked API keys', async () => {
    const keyId = 'c'.repeat(24);
    const secret = 'revoked-secret'; // allow-secret
    const apiKeyGuard = new AuthGuard(undefined, mockPool as any);

    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 'api-key-db-id-3',
        user_id: 'user-api-3',
          key_hash: deriveApiKeyVerifier(secret),
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        revoked_at: new Date().toISOString(),
        email: 'api3@styx.protocol',
        role: 'USER',
        status: 'ACTIVE',
      }],
    });

    const context = createMockContext({
      extraHeaders: { 'x-api-key': `styx_live_${keyId}_${secret}` },
    });

    await expect(apiKeyGuard.canActivate(context)).rejects.toThrow('API key has been revoked');
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });

  it('should prefer an explicit API key over a session cookie', async () => {
    const keyId = 'd'.repeat(24);
    const secret = 'explicit-key-secret'; // allow-secret
    const cookieToken = jwt.sign(
      { sub: 'cookie-user', email: 'cookie@styx.protocol' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );
    const apiKeyGuard = new AuthGuard(undefined, mockPool as any);

    mockPool.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'api-key-db-id-4',
          user_id: 'user-api-4',
          key_hash: deriveApiKeyVerifier(secret),
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          revoked_at: null,
          email: 'api4@styx.protocol',
          role: 'USER',
          status: 'ACTIVE',
        }],
      })
      .mockResolvedValueOnce(undefined);

    const context = createMockContext({
      cookie: `styx_auth_token=${encodeURIComponent(cookieToken)}`,
      extraHeaders: { 'x-api-key': `styx_live_${keyId}_${secret}` },
    });

    await expect(apiKeyGuard.canActivate(context)).resolves.toBe(true);

    const request = context.switchToHttp().getRequest() as any;
    expect(request.user.id).toBe('user-api-4');
    expect(request.authSource).toBe('api_key');
  });
});
