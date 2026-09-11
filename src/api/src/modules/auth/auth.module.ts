import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { ReferralModule } from '../referrals/referral.module';
import { SecurityModule } from '../security/security.module';

@Global()
@Module({
  imports: [ReferralModule, SecurityModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
