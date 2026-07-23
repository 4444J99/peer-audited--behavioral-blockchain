import { Global, Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ComplianceArtifactService } from './compliance-artifact.service';
import { ComplianceController } from './compliance.controller';
import { CompliancePolicyService } from './compliance-policy.service';
import { GeofenceGuard } from '../../common/guards/geofence.guard';
import { ComplianceAccessGuard } from '../../common/guards/compliance-access.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { IdentityVerificationService } from './identity-verification.service';
import {
  IdentityProviderService,
  MockIdentityProviderAdapter,
  StripeIdentityProviderAdapter,
} from './identity-provider.service';
import { MedicalExemptionService } from './medical-exemption.service';
import { DeviceAttestationService } from '../../../services/security/device-attestation.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { ContractsModule } from '../contracts/contracts.module';
import { EmailModule } from '../email/email.module';

@Global()
@Module({
  imports: [DatabaseModule, EmailModule, forwardRef(() => ContractsModule)],
  controllers: [ComplianceController],
  providers: [
    ComplianceArtifactService,
    CompliancePolicyService,
    IdentityVerificationService,
    IdentityProviderService,
    MockIdentityProviderAdapter,
    StripeIdentityProviderAdapter,
    GeofenceGuard,
    ComplianceAccessGuard,
    RoleGuard,
    MedicalExemptionService,
    DeviceAttestationService,
    TruthLogService,
  ],
  exports: [
    CompliancePolicyService,
    IdentityVerificationService,
    GeofenceGuard,
    ComplianceAccessGuard,
    MedicalExemptionService,
    DeviceAttestationService,
  ],
})
export class ComplianceModule {}
