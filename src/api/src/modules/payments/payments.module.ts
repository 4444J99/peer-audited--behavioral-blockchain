import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { ContractsModule } from '../contracts/contracts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { PaymentRouterService } from './payment-router.service';

@Module({
  imports: [ContractsModule, NotificationsModule, ComplianceModule],
  controllers: [PaymentsController],
  providers: [PaymentRouterService],
  exports: [PaymentRouterService],
})
export class PaymentsModule {}
