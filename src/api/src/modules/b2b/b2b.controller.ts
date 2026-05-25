import { Controller, Get, Post, Param, Body, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
    private readonly pool: Pool,
    private readonly billing: BillingService,
    private readonly webhook: WebhookService,
    private readonly metrics: MetricsService,
    private readonly anonymize: AnonymizeService,
    private readonly dataLake: DataLakeService,
  ) {}

  /**
   * @Roles('ADMIN') only proves the caller is a platform admin — it is NOT
   * tenant-scoped. Without this check, any admin could read any enterprise's data
   * by changing the path param. We require that the caller actually belongs to
   * (and is an admin of) the requested enterprise. The caller's enterprise is
   * derived from their own user record, never trusted from the path.
   */
  private async assertEnterpriseMembership(
    requesterId: string,
    enterpriseId: string,
  ): Promise<void> {
    if (!enterpriseId) {
      throw new ForbiddenException('enterpriseId is required');
    }

    const result = await this.pool.query(
      'SELECT enterprise_id, role FROM users WHERE id = $1',
      [requesterId],
    );

    if (result.rows.length === 0) {
      throw new ForbiddenException('User not found');
    }

    const { enterprise_id: callerEnterpriseId, role } = result.rows[0];
    if (!callerEnterpriseId || callerEnterpriseId !== enterpriseId) {
      throw new ForbiddenException('Not authorized for this enterprise');
    }
    if (String(role || '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Enterprise admin role required');
    }
  }

  @Get('metrics/:enterpriseId')
  @ApiOperation({ summary: 'Get enterprise compliance metrics' })
  async getMetrics(
    @CurrentUser() user: { id: string },
    @Param('enterpriseId') enterpriseId: string,
  ) {
    await this.assertEnterpriseMembership(user.id, enterpriseId);
    return this.metrics.getEnterpriseMetrics(enterpriseId);
  }

  @Get('billing/:enterpriseId')
  @ApiOperation({ summary: 'Get enterprise billing summary' })
  async getBilling(
    @CurrentUser() user: { id: string },
    @Param('enterpriseId') enterpriseId: string,
  ) {
    await this.assertEnterpriseMembership(user.id, enterpriseId);
    // NOTE: this is a read-only fetch; it must NOT emit a metered consumption
    // event (that would bill the customer for simply viewing their bill).
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
  async registerWebhook(
    @CurrentUser() user: { id: string },
    @Body() body: { enterpriseId: string; url: string },
  ) {
    await this.assertEnterpriseMembership(user.id, body.enterpriseId);
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
  async exportHrData(
    @CurrentUser() user: { id: string },
    @Param('enterpriseId') enterpriseId: string,
  ) {
    await this.assertEnterpriseMembership(user.id, enterpriseId);
    return this.anonymize.anonymizeEmployeeData(enterpriseId, []);
  }

  @Get('datalake/:enterpriseId')
  @ApiOperation({ summary: 'Extract a time-bounded snapshot from the enterprise data lake' })
  async getDataLakeSnapshot(
    @CurrentUser() user: { id: string },
    @Param('enterpriseId') enterpriseId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    await this.assertEnterpriseMembership(user.id, enterpriseId);
    return this.dataLake.extractSnapshot(enterpriseId, start, end);
  }
}
