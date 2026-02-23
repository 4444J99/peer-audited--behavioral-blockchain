import { Module } from '@nestjs/common';
import { B2BController } from './b2b.controller';
import { BillingService } from './billing.service';
import { WebhookService } from './webhook.service';
import { MetricsService } from './metrics.service';

@Module({
  controllers: [B2BController],
  providers: [BillingService, WebhookService, MetricsService],
  exports: [BillingService, WebhookService, MetricsService],
})
export class B2BModule {}
