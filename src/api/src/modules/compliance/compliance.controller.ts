import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser, Public } from '../../common/decorators/current-user.decorator';
import { CompliancePolicyService } from './compliance-policy.service';
import { IdentityVerificationService } from './identity-verification.service';
import { MedicalExemptionService } from './medical-exemption.service';

@ApiTags('Compliance')
@Controller('compliance')
export class ComplianceController {
  constructor(
    private readonly compliancePolicy: CompliancePolicyService,
    private readonly identityVerification: IdentityVerificationService,
    private readonly medicalExemption: MedicalExemptionService,
  ) {}

  @Get('eligibility')
  @Public()
  @ApiOperation({ summary: 'Return jurisdiction + compliance eligibility decisions for the current request context' })
  eligibility(@Req() req: Request) {
    return this.compliancePolicy.getEligibility(req);
  }

  @Post('identity/webhooks/stripe')
  @Public()
  @ApiOperation({ summary: 'Receive Stripe Identity webhook events (verification status sync)' })
  async stripeIdentityWebhook(@Body() body: any) {
    return this.identityVerification.completeFromStripeWebhook(body);
  }

  @Post('medical-exemption/request')
  @ApiOperation({ summary: 'Request a compassionate audit for a contract due to medical emergency' })
  async requestMedicalExemption(
    @CurrentUser() user: any,
    @Body() body: { contractId: string; reason: string; documentationUri?: string }
  ) {
    return this.medicalExemption.requestExemption({
      ...body,
      userId: user.sub,
    });
  }

  @Post('medical-exemption/approve')
  @ApiOperation({ summary: 'Approve a medical exemption request (Admin only)' })
  async approveMedicalExemption(
    @CurrentUser() user: any,
    @Body() body: { contractId: string }
  ) {
    // Basic role check if user object has it
    if (user.role !== 'ADMIN') {
      throw new Error('Unauthorized: Admin access required');
    }
    return this.medicalExemption.approveExemption(body.contractId, user.sub);
  }
}
