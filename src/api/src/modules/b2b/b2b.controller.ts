import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BillingService } from './billing.service';
import { WebhookService } from './webhook.service';
import { WebhookSubscriptionService } from './webhook-subscription.service';
import { MetricsService } from './metrics.service';
import { AnonymizeService } from './anonymize.service';
import { DataLakeService } from './datalake.service';
import { CrmService } from './crm.service';
import { EMPLOYEE_EVENT_TYPES, EmployeeEventType } from './connectors/crm-connector.interface';

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
    private readonly webhookSubscriptions: WebhookSubscriptionService,
    private readonly metrics: MetricsService,
    private readonly anonymize: AnonymizeService,
    private readonly dataLake: DataLakeService,
    private readonly crm: CrmService,
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

  /**
   * eventType arrives as free-text JSON. Anything accepted here is forwarded to a
   * customer's live Salesforce/HubSpot org, so it is checked against the connector
   * union at the edge rather than cast into it.
   */
  private assertEmployeeEventType(value: string, field: string): EmployeeEventType {
    if (!(EMPLOYEE_EVENT_TYPES as readonly string[]).includes(value)) {
      throw new BadRequestException(
        `${field} must be one of: ${EMPLOYEE_EVENT_TYPES.join(', ')}`,
      );
    }
    return value as EmployeeEventType;
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
    const subscription = await this.webhookSubscriptions.register(
      body.enterpriseId,
      body.url,
      user.id,
    );
    return {
      status: 'registered',
      subscriptionId: subscription.id,
      enterpriseId: subscription.enterpriseId,
      url: subscription.url,
    };
  }

  @Get('webhook/subscriptions/:enterpriseId')
  @ApiOperation({ summary: 'List the active webhook subscriptions of an enterprise' })
  async listWebhookSubscriptions(
    @CurrentUser() user: { id: string },
    @Param('enterpriseId') enterpriseId: string,
  ) {
    await this.assertEnterpriseMembership(user.id, enterpriseId);
    return this.webhookSubscriptions.listActive(enterpriseId);
  }

  @Post('webhook/test')
  @ApiOperation({ summary: 'Send a test event to a webhook URL' })
  async testWebhook(
    @CurrentUser() user: { id: string },
    @Body() body: { enterpriseId: string; url: string },
  ) {
    // PRV6: like every other B2B route, scope this to a verified enterprise admin.
    // Without it, any platform admin could POST to an arbitrary `url` and (with the
    // SSRF guard bypasses in PRV7) probe internal hosts. Tenant membership is derived
    // from the caller's own record, never trusted from the body.
    await this.assertEnterpriseMembership(user.id, body.enterpriseId);
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

  @Get('crm/integrity/:enterpriseId')
  @ApiOperation({ summary: 'Get the aggregate corporate integrity score for an enterprise' })
  async getCorporateIntegrityScore(
    @CurrentUser() user: { id: string },
    @Param('enterpriseId') enterpriseId: string,
  ) {
    await this.assertEnterpriseMembership(user.id, enterpriseId);
    return this.crm.calculateCorporateIntegrityScore(enterpriseId);
  }

  @Post('crm/events/:enterpriseId')
  @ApiOperation({ summary: 'Push an employee behavioral event to the configured CRM connectors' })
  async pushCrmEvent(
    @CurrentUser() user: { id: string },
    @Param('enterpriseId') enterpriseId: string,
    @Body() body: { employeeId: string; eventType: string; metadata?: Record<string, unknown> },
  ) {
    await this.assertEnterpriseMembership(user.id, enterpriseId);
    const eventType = this.assertEmployeeEventType(body.eventType, 'eventType');
    if (!body.employeeId) {
      throw new BadRequestException('employeeId is required');
    }

    // The timestamp is stamped server-side: a client-supplied one would let an
    // enterprise admin backdate behavioral events in their own CRM record.
    await this.crm.pushEmployeeEvent(enterpriseId, {
      employeeId: body.employeeId,
      eventType,
      timestamp: new Date(),
      metadata: body.metadata ?? {},
    });

    return { status: 'dispatched', enterpriseId, employeeId: body.employeeId, eventType };
  }

  @Post('crm/interactions/:enterpriseId')
  @ApiOperation({ summary: 'Log a CRM interaction against an enterprise employee' })
  async logCrmInteraction(
    @CurrentUser() user: { id: string },
    @Param('enterpriseId') enterpriseId: string,
    @Body() body: { email: string; type: string; metadata?: Record<string, unknown> },
  ) {
    await this.assertEnterpriseMembership(user.id, enterpriseId);
    const type = this.assertEmployeeEventType(body.type, 'type');
    if (!body.email) {
      throw new BadRequestException('email is required');
    }

    await this.crm.logInteraction(body.email, type, body.metadata ?? {});
    return { status: 'logged', enterpriseId, email: body.email, type };
  }

  @Post('crm/sync/:enterpriseId')
  @ApiOperation({ summary: 'Sync an enterprise employee into the configured CRM' })
  async syncCrmUser(
    @CurrentUser() user: { id: string },
    @Param('enterpriseId') enterpriseId: string,
    @Body() body: { email: string; firstName?: string; lastName?: string },
  ) {
    await this.assertEnterpriseMembership(user.id, enterpriseId);
    if (!body.email) {
      throw new BadRequestException('email is required');
    }

    // CrmService resolves the CRM tenant from `company`, so it is pinned to the
    // enterprise the caller was just verified against — never taken from the body,
    // which would let a verified admin of one tenant pull another tenant's roster.
    await this.crm.syncUser({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      company: enterpriseId,
    });

    return { status: 'synced', enterpriseId, email: body.email };
  }
}
