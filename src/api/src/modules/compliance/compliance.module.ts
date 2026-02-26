import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ComplianceController } from './compliance.controller';
import { CompliancePolicyService } from './compliance-policy.service';
import { GeofenceGuard } from '../../common/guards/geofence.guard';
import { ComplianceAccessGuard } from '../../common/guards/compliance-access.guard';
import { IdentityVerificationService } from './identity-verification.service';
import {
  IdentityProviderService,
  MockIdentityProviderAdapter,
  StripeIdentityProviderAdapter,
} from './identity-provider.service';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [ComplianceController],
  providers: [
    CompliancePolicyService,
    IdentityVerificationService,
    IdentityProviderService,
    MockIdentityProviderAdapter,
    StripeIdentityProviderAdapter,
    GeofenceGuard,
    ComplianceAccessGuard,
  ],
  exports: [CompliancePolicyService, IdentityVerificationService, GeofenceGuard, ComplianceAccessGuard],
})
export class ComplianceModule {}
