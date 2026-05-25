import { Body, Controller, Get, Post, RawBodyRequest, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CurrentUser, Public } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../../guards/auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
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
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Receive Stripe Identity webhook events (verification status sync)' })
  async stripeIdentityWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const signature = req.headers['stripe-signature'];
    const result = await this.identityVerification.completeFromStripeWebhook({
      rawBody: req.rawBody,
      signature: Array.isArray(signature) ? signature[0] : signature,
    });

    // Reject forged / unverifiable events with a 400 so the sender does not treat
    // them as accepted.
    if (!result.applied && result.reason === 'invalid_signature') {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    return res.json(result);
  }

  @Post('medical-exemption/request')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a compassionate audit for a contract due to medical emergency' })
  async requestMedicalExemption(
    @CurrentUser() user: any,
    @Body() body: { contractId: string; reason: string; documentationUri?: string }
  ) {
    return this.medicalExemption.requestExemption({
      ...body,
      userId: user.id,
    });
  }

  @Post('medical-exemption/approve')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a medical exemption request (Admin only)' })
  async approveMedicalExemption(
    @CurrentUser() user: any,
    @Body() body: { contractId: string }
  ) {
    return this.medicalExemption.approveExemption(body.contractId, user.id);
  }
}
