import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { ContractsModule } from '../contracts/contracts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ContractsModule, NotificationsModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
