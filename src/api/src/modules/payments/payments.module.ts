import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { ContractsModule } from '../contracts/contracts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentRouterService } from './payment-router.service';

@Module({
  imports: [ContractsModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentRouterService],
  exports: [PaymentRouterService],
})
export class PaymentsModule {}
