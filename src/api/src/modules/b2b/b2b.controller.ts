import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../../guards/auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import { BillingService } from './billing.service';
import { WebhookService } from './webhook.service';
import { MetricsService } from './metrics.service';
import { AnonymizeService } from './anonymize.service';
import { DataLakeService } from './datalake.service';

@ApiTags('B2B')
@ApiBearerAuth()
@Controller('b2b')
@UseGuards(AuthGuard, RoleGuard)
@Roles('ADMIN')
export class B2BController {
  constructor(
    private readonly billing: BillingService,
    private readonly webhook: WebhookService,
    private readonly metrics: MetricsService,
    private readonly anonymize: AnonymizeService,
    private readonly dataLake: DataLakeService,
  ) {}

  @Get('metrics/:enterpriseId')
  @ApiOperation({ summary: 'Get enterprise compliance metrics' })
  async getMetrics(@Param('enterpriseId') enterpriseId: string) {
    return this.metrics.getEnterpriseMetrics(enterpriseId);
  }

  @Get('billing/:enterpriseId')
  @ApiOperation({ summary: 'Get enterprise billing summary' })
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
  @ApiOperation({ summary: 'Register a webhook URL for enterprise event notifications' })
  async registerWebhook(@Body() body: { enterpriseId: string; url: string }) {
    return {
      status: 'registered',
      enterpriseId: body.enterpriseId,
      url: body.url,
    };
  }

  @Post('webhook/test')
  @ApiOperation({ summary: 'Send a test event to a webhook URL' })
  async testWebhook(@Body() body: { url: string }) {
    const sent = await this.webhook.dispatchEnterpriseMetricEvent(
      body.url,
      { type: 'TEST', timestamp: new Date().toISOString() },
    );
    return { status: sent ? 'sent' : 'failed' };
  }

  @Get('export/hr/:enterpriseId')
  @ApiOperation({ summary: 'Export anonymized HR compliance data' })
  async exportHrData(@Param('enterpriseId') enterpriseId: string) {
    const metrics = await this.metrics.getEnterpriseMetrics(enterpriseId);
    return this.anonymize.anonymizeEmployeeData(enterpriseId, []);
  }

  @Get('datalake/:enterpriseId')
  @ApiOperation({ summary: 'Extract a time-bounded snapshot from the enterprise data lake' })
  async getDataLakeSnapshot(
    @Param('enterpriseId') enterpriseId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.dataLake.extractSnapshot(enterpriseId, start, end);
  }
}
