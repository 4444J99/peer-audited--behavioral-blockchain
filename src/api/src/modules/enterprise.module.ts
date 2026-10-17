import { Module } from "@nestjs/common";
import { PractitionerPortalService } from "./practitioner-portal.service";
import { EnterpriseSSOService } from "./enterprise-sso.service";
import { EnterpriseApiKeyService } from "./enterprise-api-key.service";
import { ComplianceReportService } from "./compliance-report.service";
import { EnterpriseController } from "./enterprise.controller";

@Module({
  controllers: [EnterpriseController],
  providers: [
    PractitionerPortalService,
    EnterpriseSSOService,
    EnterpriseApiKeyService,
    ComplianceReportService,
  ],
  exports: [
    PractitionerPortalService,
    EnterpriseSSOService,
    EnterpriseApiKeyService,
    ComplianceReportService,
  ],
})
export class EnterpriseModule {}

export { PractitionerPortalService } from "./practitioner-portal.service";
export { EnterpriseSSOService } from "./enterprise-sso.service";
export { EnterpriseApiKeyService } from "./enterprise-api-key.service";
export { ComplianceReportService } from "./compliance-report.service";
export { EnterpriseController } from "./enterprise.controller";
