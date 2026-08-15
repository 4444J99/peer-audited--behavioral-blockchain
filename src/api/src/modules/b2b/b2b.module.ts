import { Module } from "@nestjs/common";
import { B2BController } from "./b2b.controller";
import { BillingService } from "./billing.service";
import { WebhookService } from "./webhook.service";
import { WebhookSubscriptionService } from "./webhook-subscription.service";
import { EnterpriseWebhookWorker } from "./enterprise-webhook.worker";
import { MetricsService } from "./metrics.service";
import { AnonymizeService } from "./anonymize.service";
import { DataLakeService } from "./datalake.service";
import { CrmService } from "./crm.service";
import { EnterpriseScopeService } from "./enterprise-scope.service";
import { SalesforceConnector } from "./connectors/salesforce.connector";
import { HubSpotConnector } from "./connectors/hubspot.connector";
import { RoleGuard } from "../../common/guards/role.guard";

@Module({
  controllers: [B2BController],
  providers: [
    BillingService,
    WebhookService,
    WebhookSubscriptionService,
    EnterpriseWebhookWorker,
    MetricsService,
    AnonymizeService,
    DataLakeService,
    CrmService,
    EnterpriseScopeService,
    SalesforceConnector,
    HubSpotConnector,
    RoleGuard,
  ],
  exports: [
    BillingService,
    WebhookService,
    WebhookSubscriptionService,
    MetricsService,
    AnonymizeService,
    DataLakeService,
    CrmService,
    EnterpriseScopeService,
  ],
})
export class B2BModule {}
