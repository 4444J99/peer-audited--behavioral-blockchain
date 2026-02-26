import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/current-user.decorator';
import { CompliancePolicyService } from './compliance-policy.service';
import { IdentityVerificationService } from './identity-verification.service';

@ApiTags('Compliance')
@Controller('compliance')
export class ComplianceController {
  constructor(
    private readonly compliancePolicy: CompliancePolicyService,
    private readonly identityVerification: IdentityVerificationService,
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
}
