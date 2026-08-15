import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Pool } from 'pg';
import * as jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'crypto';
import {
  getJwtSecret,
  deriveCsrfToken,
  parseApiKey,
  deriveApiKeyVerifier,
} from '../src/modules/auth/auth.service';
import { consumeSseTicket, SseTicketScope } from './sse-ticket.store';

export const IS_PUBLIC_KEY = 'isPublic';

interface SseStreamRoute {
  pathSuffix: string;
  scope: SseTicketScope;
  cookieName: string;
}

// One table for every ticket-bearing SSE route. The previous two-scope form
// derived the cookie name from a ternary, so any third scope would silently
// have been looked up under the fury cookie — a lookup that fails open into
// the query-param path rather than reporting the mistake.
const SSE_STREAM_ROUTES: readonly SseStreamRoute[] = [
  {
    pathSuffix: '/notifications/stream',
    scope: 'notifications',
    cookieName: 'styx_notifications_sse_ticket',
  },
  {
    pathSuffix: '/fury/stream',
    scope: 'fury',
    cookieName: 'styx_fury_sse_ticket',
  },
  {
    pathSuffix: '/dashboard/leaderboard/stream',
    scope: 'leaderboard',
    cookieName: 'styx_leaderboard_sse_ticket',
  },
];

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Optional()
    private readonly reflector?: Reflector,
    @Optional()
    private readonly pool?: Pool,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Check for @Public() decorator
    const isPublic = this.reflector?.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKeyFromHeader(request); // allow-secret
    if (apiKey) {
      return this.activateWithApiKey(request, apiKey);
    }

    const headerToken = this.extractTokenFromHeader(request); // allow-secret
    const cookieToken = headerToken ? undefined : this.extractTokenFromCookie(request); // allow-secret
    const token = headerToken || cookieToken;
    const authSource = headerToken ? 'bearer' : (cookieToken ? 'cookie' : null);

    if (!token) {
      const sseTicketUserId = this.consumeSseTicketForRequest(request);
      if (sseTicketUserId) {
        // AU9 (residual): SSE tickets carry no role, so we pin role:'USER' here and
        // intentionally do NOT grant privileges from a ticket. Any handler that needs
        // role/email MUST re-check them against the DB (the fury stream already does)
        // — never trust this synthetic principal for authorization decisions.
        (request as any).user = { id: sseTicketUserId, email: '', role: 'USER', sub: sseTicketUserId };
        return true;
      }
    }

    if (!token) {
      throw new UnauthorizedException('Missing Authorization Bearer token');
    }

    // Resolve secret outside try/catch so production enforcement errors propagate
    const secret = getJwtSecret();

    // Decode real JWT — single source of truth for secret via auth.service.ts
    let payload: { sub: string; email: string; role?: string };
    try {
      payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { sub: string; email: string; role?: string };
    } catch {
      throw new UnauthorizedException('Invalid or expired Authentication Token');
    }

    // CSRF is only relevant for cookie-borne sessions on state-changing methods.
    // The CSRF token is bound to the session by deriving it (HMAC) from the
    // access token, so a token set on a sibling cookie cannot satisfy the check
    // for a different victim session. Compared in constant time.
    if (authSource === 'cookie' && this.requiresCsrfValidation(request) && !this.hasValidCsrfToken(request, token)) {
      throw new ForbiddenException('Missing or invalid CSRF token');
    }

    (request as any).user = { id: payload.sub, email: payload.email, role: payload.role || 'USER', sub: payload.sub };
    (request as any).authSource = authSource;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      return token; // allow-secret
    }

    return undefined;
  }

  private extractApiKeyFromHeader(request: Request): string | undefined {
    const directHeader = request.headers['x-api-key'];
    const directApiKey = Array.isArray(directHeader) ? directHeader[0] : directHeader;
    if (directApiKey) {
      return directApiKey; // allow-secret
    }

    const [type, credential] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'ApiKey' && credential) {
      return credential; // allow-secret
    }

    return undefined;
  }

  private async activateWithApiKey(request: Request, apiKey: string): Promise<boolean> { // allow-secret
    const parsed = parseApiKey(apiKey);
    if (!parsed) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!this.pool) {
      throw new UnauthorizedException('API key authentication is not configured');
    }

    const keyHash = deriveApiKeyVerifier(parsed.secret); // allow-secret
    const result = await this.pool.query(
      `SELECT ak.id, ak.user_id, ak.key_hash, ak.expires_at, ak.revoked_at,
              u.email, u.role, u.status
       FROM api_keys ak
       JOIN users u ON u.id = ak.user_id
       WHERE ak.key_id = $1`,
      [parsed.keyId],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid API key');
    }

    const row = result.rows[0];
    if (!this.hasMatchingApiKeyHash(row.key_hash, keyHash)) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (row.revoked_at) {
      throw new UnauthorizedException('API key has been revoked');
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    if (String(row.status || '').toUpperCase() !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    await this.pool.query(
      `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
      [row.id],
    );

    (request as any).user = {
      id: row.user_id,
      email: row.email,
      role: row.role || 'USER',
      sub: row.user_id,
      apiKeyId: parsed.keyId,
      apiKeyDbId: row.id,
    };
    (request as any).authSource = 'api_key';
    return true;
  }

  private hasMatchingApiKeyHash(storedHash: string, presentedHash: string): boolean {
    const storedBuf = Buffer.from(storedHash, 'hex');
    const presentedBuf = Buffer.from(presentedHash, 'hex');
    if (storedBuf.length !== presentedBuf.length) {
      return false;
    }
    return timingSafeEqual(storedBuf, presentedBuf);
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    const token = this.getCookieValue(request, 'styx_auth_token');
    return token || undefined; // allow-secret
  }

  private requiresCsrfValidation(request: Request): boolean {
    const method = String(request.method || 'GET').toUpperCase();
    return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
  }

  private hasValidCsrfToken(request: Request, sessionToken: string): boolean {
    const headerValue = request.headers['x-csrf-token'];
    const csrfHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (!csrfHeader) {
      return false;
    }

    // The expected value is derived deterministically from the session's access
    // token, so only a client that legitimately holds this session can produce a
    // matching CSRF token. This binds the token to the session rather than
    // relying on an attacker-settable double-submit cookie.
    const expected = deriveCsrfToken(sessionToken);

    const headerBuf = Buffer.from(csrfHeader);
    const expectedBuf = Buffer.from(expected);
    if (headerBuf.length !== expectedBuf.length) {
      return false;
    }
    return timingSafeEqual(headerBuf, expectedBuf);
  }

  private consumeSseTicketForRequest(request: Request): string | null {
    const route = this.getSseStreamRoute(request);
    if (!route) {
      return null;
    }

    // AU8 (residual): the HttpOnly cookie path (issued by /…/stream-cookie) is the
    // PREFERRED credential channel — a query-string ticket can leak into proxy logs,
    // browser history and Referer headers. We try the cookie first and fall back to
    // the query param, which is retained because the EventSource clients that cannot
    // attach an Authorization header still rely on /…/stream-ticket. Single-use +
    // 60s TTL bounds the exposure of any leaked query-param ticket.
    const cookieTicketPreferred = this.getCookieValue(request, route.cookieName);
    if (cookieTicketPreferred) {
      return consumeSseTicket(cookieTicketPreferred, route.scope);
    }

    if (request.query && typeof request.query.ticket === 'string') {
      return consumeSseTicket(request.query.ticket, route.scope);
    }

    return null;
  }

  private getSseStreamRoute(request: Request): SseStreamRoute | null {
    const rawPath = (request.originalUrl || request.path || '').split('?')[0];
    return SSE_STREAM_ROUTES.find((route) => rawPath.endsWith(route.pathSuffix)) ?? null;
  }

  private getCookieValue(request: Request, name: string): string | null {
    const rawCookie = request.headers.cookie;
    if (!rawCookie) {
      return null;
    }

    const cookies = rawCookie.split(';');
    for (const cookie of cookies) {
      const [rawKey, ...rawValue] = cookie.trim().split('=');
      if (rawKey === name) {
        return decodeURIComponent(rawValue.join('='));
      }
    }

    return null;
  }
}
