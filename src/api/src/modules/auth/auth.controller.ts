import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, EnterpriseTokenDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate and receive a JWT token' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('enterprise')
  @ApiOperation({ summary: 'Exchange an enterprise SSO token for a session JWT' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async enterpriseLogin(@Body() dto: EnterpriseTokenDto) {
    return this.authService.exchangeEnterpriseToken(dto.enterpriseToken);
  }
}
