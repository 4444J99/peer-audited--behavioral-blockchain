import { Controller, Post, Body, Res, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService, deriveCsrfToken } from './auth.service';
import { RegisterDto, LoginDto, EnterpriseTokenDto } from './dto';

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private async issueBrowserSessionCookies(res: Response, userId: string, accessToken: string) {
    // CSRF token is bound to (derived from) the access token so the guard can
    // verify it against the session rather than trusting an arbitrary cookie.
    const csrfToken = deriveCsrfToken(accessToken);
    const secure = process.env.NODE_ENV === 'production';
    const sameSite = 'lax' as const;

    // Access token — short-lived (15 min)
    res.cookie('styx_auth_token', accessToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });

    // Refresh token — long-lived (7 days), restricted to /auth/refresh path
    const refreshToken = await this.authService.generateRefreshToken(userId); // allow-secret
    res.cookie('styx_refresh_token', refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/auth/refresh',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    res.cookie('styx_csrf_token', csrfToken, {
      httpOnly: false,
      secure,
      sameSite,
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
  }

  private clearBrowserSessionCookies(res: Response) {
    const secure = process.env.NODE_ENV === 'production';
    const sameSite = 'lax' as const;
    res.clearCookie('styx_auth_token', { path: '/', secure, sameSite });
    res.clearCookie('styx_refresh_token', { path: '/auth/refresh', secure, sameSite });
    res.clearCookie('styx_csrf_token', { path: '/', secure, sameSite });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto.email, dto.password, {
      ageConfirmation: dto.ageConfirmation,
      termsAccepted: dto.termsAccepted,
      dateOfBirth: dto.dateOfBirth ?? '',
    });
    await this.issueBrowserSessionCookies(res, result.userId, result.token);
    return result;
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate and receive a JWT token' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto.email, dto.password);
    await this.issueBrowserSessionCookies(res, result.userId, result.token);
    return result;
  }

  @Post('enterprise')
  @ApiOperation({ summary: 'Exchange an enterprise SSO token for a session JWT' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async enterpriseLogin(@Body() dto: EnterpriseTokenDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.exchangeEnterpriseToken(dto.enterpriseToken);
    await this.issueBrowserSessionCookies(res, result.userId, result.token);
    return result;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  // AU5: rate-limit token rotation to curb refresh-token abuse / rotation amplification.
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.getCookieValue(req, 'styx_refresh_token'); // allow-secret
    if (!refreshToken) {
      throw new (await import('@nestjs/common')).UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    const secure = process.env.NODE_ENV === 'production';
    const sameSite = 'lax' as const;

    res.cookie('styx_auth_token', result.token, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });

    res.cookie('styx_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/auth/refresh',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    // Re-issue the CSRF cookie bound to the new access token so the double-submit
    // value stays in sync with the rotated session.
    res.cookie('styx_csrf_token', deriveCsrfToken(result.token), {
      httpOnly: false,
      secure,
      sameSite,
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });

    return { userId: result.userId, token: result.token };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear browser session cookies and revoke refresh tokens' })
  // AU5: rate-limit logout to match the other auth endpoints.
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // AU10: revoke refresh tokens even when the access token has expired. The old
    // code used verifyToken (which enforces expiry), so an expired access token threw
    // and the catch swallowed it — leaving 7-day refresh tokens valid after "logout".
    // We now verify the signature while IGNORING expiry, so an expired-but-genuine
    // token still identifies the user and triggers revocation. The signature check
    // prevents an attacker from forging a token to revoke someone else's sessions.
    try {
      const token = this.getCookieValue(req, 'styx_auth_token'); // allow-secret
      if (token) {
        const payload = this.authService.verifyTokenIgnoringExpiry(token);
        await this.authService.revokeRefreshTokensForUser(payload.sub);
      }
    } catch {
      // Token missing or signature invalid; still clear cookies.
    }
    this.clearBrowserSessionCookies(res);
    return { status: 'logged_out' };
  }

  @Get('csrf')
  @ApiOperation({ summary: 'Refresh CSRF cookie for browser session requests' })
  // AU5: rate-limit CSRF cookie issuance like the other auth endpoints.
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async csrf(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // The CSRF token is bound to the active session, so it can only be derived
    // for a request that already carries a valid access-token cookie.
    const accessToken = this.getCookieValue(req, 'styx_auth_token'); // allow-secret
    if (!accessToken) {
      throw new (await import('@nestjs/common')).UnauthorizedException('No active session');
    }
    const csrfToken = deriveCsrfToken(accessToken);
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('styx_csrf_token', csrfToken, {
      httpOnly: false,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
    return { csrfToken };
  }

  private getCookieValue(req: Request, name: string): string | null {
    const rawCookie = req.headers.cookie;
    if (!rawCookie) return null;
    for (const cookie of rawCookie.split(';')) {
      const [rawKey, ...rawValue] = cookie.trim().split('=');
      if (rawKey === name) {
        return decodeURIComponent(rawValue.join('='));
      }
    }
    return null;
  }
}
