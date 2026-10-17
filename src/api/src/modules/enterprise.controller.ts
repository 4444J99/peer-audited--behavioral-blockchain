import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../guards/auth.guard";
import { RoleGuard, Roles } from "../common/guards/role.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PractitionerPortalService } from "../practitioner-portal.service";
import { EnterpriseSSOService } from "../enterprise-sso.service";
import { EnterpriseApiKeyService } from "../enterprise-api-key.service";
import { ComplianceReportService } from "../compliance-report.service";

@ApiTags('Enterprise')
@ApiBearerAuth()
@Controller('enterprise')
@UseGuards(AuthGuard, RoleGuard)
export class EnterpriseController {
  constructor(
    private readonly practitionerPortal: PractitionerPortalService,
    private readonly enterpriseSSO: EnterpriseSSOService,
    private readonly enterpriseApiKey: EnterpriseApiKeyService,
    private readonly complianceReport: ComplianceReportService,
  ) {}

  @Get('practitioner-portal/dashboard')
  @ApiOperation({ summary: 'Get practitioner portal dashboard' })
  @Roles('PRACTITIONER')
  async getPractitionerDashboard(
    @CurrentUser() user: { id: string },
    @Query('start') startDate?: string,
    @Query('end') endDate?: string,
  ) {
    return this.practitionerPortal.getPractitionerDashboard(
      user.id,
      startDate,
      endDate,
    );
  }

  @Get('practitioner-portal/clients')
  @ApiOperation({ summary: 'Get practitioner's clients' })
  @Roles('PRACTITIONER')
  async getPractitionerClients(@CurrentUser() user: { id: string }) {
    return this.practitionerPortal.getPractitionerClients(user.id);
  }

  @Post('practitioner-portal/clients')
  @ApiOperation({ summary: 'Assign a client to practitioner' })
  @Roles('PRACTITIONER')
  async assignClient(
    @CurrentUser() user: { id: string },
    @Body() body: { clientId: string; clientAlias: string },
  ) {
    return this.practitionerPortal.assignClient(
      user.id,
      body.clientId,
      body.clientAlias,
    );
  }

  @Put('practitioner-portal/clients/:clientId')
  @ApiOperation({ summary: 'Unassign a client from practitioner' })
  @Roles('PRACTITIONER')
  async unassignClient(
    @CurrentUser() user: { id: string },
    @Param('clientId') clientId: string,
  ) {
    return this.practitionerPortal.unassignClient(user.id, clientId);
  }

  @Get('sso/configs')
  @ApiOperation({ summary: 'Get enterprise SSO configurations' })
  @Roles('ADMIN')
  async getSSOConfigs(@CurrentUser() user: { id: string }) {
    return this.enterpriseSSO.getEnterpriseSSOConfigs(user.id);
  }

  @Post('sso/configs')
  @ApiOperation({ summary: 'Create enterprise SSO configuration' })
  @Roles('ADMIN')
  async createSSOConfig(
    @CurrentUser() user: { id: string },
    @Body() config: any,
  ) {
    return this.enterpriseSSO.setupSSOConfig(user.id, config);
  }

  @Put('sso/configs/:configId')
  @ApiOperation({ summary: 'Update enterprise SSO configuration' })
  @Roles('ADMIN')
  async updateSSOConfig(
    @CurrentUser() user: { id: string },
    @Param('configId') configId: string,
    @Body() updates: any,
  ) {
    return this.enterpriseSSO.updateSSOConfig(configId, updates);
  }

  @Post('sso/connect')
  @ApiOperation({ summary: 'Connect enterprise SSO for user' })
  @Roles('USER')
  async connectSSO(
    @CurrentUser() user: { id: string },
    @Body() body: { provider: string; credentialId: string; token: string; metadata?: any },
  ) {
    return this.enterpriseSSO.connectEnterpriseSSO(
      user.id,
      user.enterpriseId || "",
      body.provider,
      body.credentialId,
      body.token,
      body.metadata,
    );
  }

  @Get('sso/connections')
  @ApiOperation({ summary: 'Get enterprise SSO connections' })
  @Roles('USER')
  async getSSOConnections(@CurrentUser() user: { id: string }) {
    return this.enterpriseSSO.getUserEnterpriseSSOStatus(user.id);
  }

  @Put('sso/connections/:connectionId/disconnect')
  @ApiOperation({ summary: 'Disconnect enterprise SSO connection' })
  @Roles('USER')
  async disconnectSSO(
    @CurrentUser() user: { id: string },
    @Param('connectionId') connectionId: string,
  ) {
    return this.enterpriseSSO.disconnectEnterpriseSSO(connectionId, user.id);
  }

  @Get('sso/init/:userId')
  @ApiOperation({ summary: 'Initialize SSO auth flow' })
  @Roles('USER')
  async initSAMLAuth(@Param('userId') userId: string) {
    return this.enterpriseSSO.initSAMLAuthFlow(userId, "");
  }

  @Put('sso/complete/:requestId')
  @ApiOperation({ summary: 'Complete SSO auth flow' })
  @Roles('USER')
  async completeSAMLAuth(
    @Param('requestId') requestId: string,
    @Body() body: { response?: string },
  ) {
    return this.enterpriseSSO.completeSAMLAuth(requestId, body.response);
  }

  @Get('api-keys')
  @ApiOperation({ summary: 'Get enterprise API keys' })
  @Roles('ADMIN')
  async getEnterpriseApiKeys(
    @CurrentUser() user: { id: string },
    @Query('userId') userId?: string,
  ) {
    return this.enterpriseApiKey.getEnterpriseApiKeys(
      user.enterpriseId || "",
      userId,
    );
  }

  @Post('api-keys')
  @ApiOperation({ summary: 'Create enterprise API key' })
  @Roles('ADMIN')
  async createEnterpriseApiKey(
    @CurrentUser() user: { id: string },
    @Body() input: any,
  ) {
    return this.enterpriseApiKey.createEnterpriseApiKey(
      { ...input, enterpriseId: user.enterpriseId || "" },
      user.id,
    );
  }

  @Put('api-keys/{keyId}/revoke')
  @ApiOperation({ summary: 'Revoke enterprise API key' })
  @Roles('ADMIN')
  async revokeEnterpriseApiKey(
    @CurrentUser() user: { id: string },
    @Param('keyId') keyId: string,
  ) {
    return this.enterpriseApiKey.revokeEnterpriseApiKey(
      keyId,
      user.enterpriseId || "",
      user.id,
    );
  }

  @Put('api-keys/{keyId}/scopes')
  @ApiOperation({ summary: 'Update enterprise API key scopes' })
  @Roles('ADMIN')
  async updateEnterpriseApiKeyScopes(
    @CurrentUser() user: { id: string },
    @Param('keyId') keyId: string,
    @Body() body: { scopes: string[] },
  ) {
    return this.enterpriseApiKey.updateApiKeyScopes(
      keyId,
      user.enterpriseId || "",
      user.id,
      body.scopes,
    );
  }

  @Get('compliance-reports')
  @ApiOperation({ summary: 'Get compliance reports' })
  @Roles('ADMIN')
  async getComplianceReports(
    @CurrentUser() user: { id: string },
    @Query('status') status?: string,
  ) {
    return this.complianceReport.getComplianceReports(
      user.enterpriseId || "",
      status,
    );
  }

  @Post('compliance-reports')
  @ApiOperation({ summary: 'Create compliance report' })
  @Roles('ADMIN')
  async createComplianceReport(
    @CurrentUser() user: { id: string },
    @Body() input: any,
  ) {
    return this.complianceReport.createComplianceReport(
      { ...input, enterpriseId: user.enterpriseId || "" },
      user.id,
    );
  }

  @Put('compliance-reports/{reportId}')
  @ApiOperation({ summary: 'Update compliance report' })
  @Roles('ADMIN')
  async updateComplianceReport(
    @CurrentUser() user: { id: string },
    @Param('reportId') reportId: string,
    @Body() updates: any,
  ) {
    return this.complianceReport.updateComplianceReport(
      reportId,
      user.enterpriseId || "",
      updates,
    );
  }

  @Put('compliance-reports/{reportId}/complete')
  @ApiOperation({ summary: 'Complete compliance report' })
  @Roles('ADMIN')
  async completeComplianceReport(
    @CurrentUser() user: { id: string },
    @Param('reportId') reportId: string,
    @Body() body: { filePath: string; reportSizeBytes: number; reportEncrypted: boolean },
  ) {
    return this.complianceReport.completeComplianceReport(
      reportId,
      user.enterpriseId || "",
      body.filePath,
      body.reportSizeBytes,
      body.reportEncrypted,
    );
  }

  @Get('practitioner-portal/settings')
  @ApiOperation({ summary: 'Get practitioner portal settings' })
  @Roles('PRACTITIONER')
  async getPractitionerSettings(@CurrentUser() user: { id: string }) {
    return this.practitionerPortal.getPractitionerSettings(user.id);
  }

  @Put('practitioner-portal/settings')
  @ApiOperation({ summary: 'Update practitioner portal settings' })
  @Roles('PRACTITIONER')
  async updatePractitionerSettings(
    @CurrentUser() user: { id: string },
    @Body() settings: any,
  ) {
    return this.practitionerPortal.updatePractitionerSettings(user.id, settings);
  }
}

export { PractitionerPortalService } from "../practitioner-portal.service";
export { EnterpriseSSOService } from "../enterprise-sso.service";
export { EnterpriseApiKeyService } from "../enterprise-api-key.service";
export { ComplianceReportService } from "../compliance-report.service";
export { PractitionerDashboard, PractitionerClient, PractitionerPortalSettings } from "../practitioner-portal.service";
export { EnterpriseSSOConfiguration, EnterpriseSSOConnection, SAMLRequest } from "../enterprise-sso.service";
export { CreateComplianceReportInput } from "../compliance-report.service";
export { CreateApiKeyInput } from "../enterprise-api-key.service";
export { EarlyAccessOnboardingEmailInput } from "../email/email.service";
export { AuthPayload } from "../auth/auth.service";