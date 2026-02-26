import { Module } from '@nestjs/common';
import { B2BController } from './b2b.controller';
import { BillingService } from './billing.service';
import { WebhookService } from './webhook.service';
import { MetricsService } from './metrics.service';
import { AnonymizeService } from './anonymize.service';
import { DataLakeService } from './datalake.service';
import { CrmService } from './crm.service';
import { SalesforceConnector } from './connectors/salesforce.connector';
import { HubSpotConnector } from './connectors/hubspot.connector';
import { RoleGuard } from '../../common/guards/role.guard';

@Module({
  controllers: [B2BController],
  providers: [BillingService, WebhookService, MetricsService, AnonymizeService, DataLakeService, CrmService, SalesforceConnector, HubSpotConnector, RoleGuard],
  exports: [BillingService, WebhookService, MetricsService, AnonymizeService, DataLakeService, CrmService],
})
export class B2BModule {}
