import { Controller, Post, Body, Res, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { randomBytes } from 'crypto';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, EnterpriseTokenDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private issueBrowserSessionCookies(res: Response, token: string) {
    const csrfToken = randomBytes(24).toString('hex');
    const secure = process.env.NODE_ENV === 'production';
    const sameSite = 'lax' as const;
    const maxAgeMs = 24 * 60 * 60 * 1000;

    res.cookie('styx_auth_token', token, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: maxAgeMs,
    });

    res.cookie('styx_csrf_token', csrfToken, {
      httpOnly: false,
      secure,
      sameSite,
      path: '/',
      maxAge: maxAgeMs,
    });
  }

  private clearBrowserSessionCookies(res: Response) {
    const secure = process.env.NODE_ENV === 'production';
    const sameSite = 'lax' as const;
    res.clearCookie('styx_auth_token', { path: '/', secure, sameSite });
    res.clearCookie('styx_csrf_token', { path: '/', secure, sameSite });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto.email, dto.password);
    this.issueBrowserSessionCookies(res, result.token);
    return result;
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate and receive a JWT token' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto.email, dto.password);
    this.issueBrowserSessionCookies(res, result.token);
    return result;
  }

  @Post('enterprise')
  @ApiOperation({ summary: 'Exchange an enterprise SSO token for a session JWT' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async enterpriseLogin(@Body() dto: EnterpriseTokenDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.exchangeEnterpriseToken(dto.enterpriseToken);
    this.issueBrowserSessionCookies(res, result.token);
    return result;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear browser session cookies' })
  async logout(@Res({ passthrough: true }) res: Response) {
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
      maxAge: 24 * 60 * 60 * 1000,
    });
    return { csrfToken };
  }
}
