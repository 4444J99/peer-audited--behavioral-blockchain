import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { GdprService } from './gdpr.service';
import { CcpaService } from './ccpa.service';
import { UsersScheduler } from './users.scheduler';
import { GdprScheduler } from './gdpr.scheduler';
import { CcpaScheduler } from './ccpa.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule, forwardRef(() => ContractsModule)],
  controllers: [UsersController],
  providers: [
    UsersService,
    GdprService,
    CcpaService,
    UsersScheduler,
    GdprScheduler,
    CcpaScheduler,
  ],
  exports: [UsersService, GdprService, CcpaService],
})
export class UsersModule {}
