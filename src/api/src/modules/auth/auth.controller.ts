import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, EnterpriseTokenDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('enterprise')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async enterpriseLogin(@Body() dto: EnterpriseTokenDto) {
    return this.authService.exchangeEnterpriseToken(dto.enterpriseToken);
  }
}
