import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../guards/auth.guard';
import { BillingService } from './billing.service';
import { WebhookService } from './webhook.service';
import { MetricsService } from './metrics.service';

@Controller('b2b')
@UseGuards(AuthGuard)
export class B2BController {
  constructor(
    private readonly billing: BillingService,
    private readonly webhook: WebhookService,
    private readonly metrics: MetricsService,
  ) {}

  @Get('metrics/:enterpriseId')
  async getMetrics(@Param('enterpriseId') enterpriseId: string) {
    return this.metrics.getEnterpriseMetrics(enterpriseId);
  }

  @Get('billing/:enterpriseId')
  async getBilling(@Param('enterpriseId') enterpriseId: string) {
    await this.billing.recordConsumptionEvent(enterpriseId, 'BILLING_QUERY');
    return {
      enterpriseId,
      plan: 'CONSUMPTION',
      events: [],
      totalDue: 0,
      currency: 'USD',
    };
  }

  @Post('webhook/register')
  async registerWebhook(@Body() body: { enterpriseId: string; url: string }) {
    return {
      status: 'registered',
      enterpriseId: body.enterpriseId,
      url: body.url,
    };
  }

  @Post('webhook/test')
  async testWebhook(@Body() body: { url: string }) {
    const sent = await this.webhook.dispatchEnterpriseMetricEvent(
      body.url,
      { type: 'TEST', timestamp: new Date().toISOString() },
    );
    return { status: sent ? 'sent' : 'failed' };
  }
}
