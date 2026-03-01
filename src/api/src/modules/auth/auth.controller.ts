import { Controller, Post, Body, Res, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, EnterpriseTokenDto } from './dto';

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private async issueBrowserSessionCookies(res: Response, userId: string, accessToken: string) {
    const csrfToken = randomBytes(24).toString('hex');
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
      dateOfBirth: dto.dateOfBirth,
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

    return { userId: result.userId, token: result.token };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear browser session cookies and revoke refresh tokens' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Try to extract user ID from access token to revoke refresh tokens
    try {
      const token = this.getCookieValue(req, 'styx_auth_token'); // allow-secret
      if (token) {
        const payload = this.authService.verifyToken(token);
        await this.authService.revokeRefreshTokensForUser(payload.sub);
      }
    } catch {
      // Token may be expired; still clear cookies
    }
    this.clearBrowserSessionCookies(res);
    return { status: 'logged_out' };
  }

  @Get('csrf')
  @ApiOperation({ summary: 'Refresh CSRF cookie for browser session requests' })
  async csrf(@Res({ passthrough: true }) res: Response) {
    const csrfToken = randomBytes(24).toString('hex');
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
