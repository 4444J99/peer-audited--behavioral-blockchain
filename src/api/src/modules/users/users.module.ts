import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { GdprService } from './gdpr.service';
import { UsersScheduler } from './users.scheduler';
import { GdprScheduler } from './gdpr.scheduler';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [UsersController],
  providers: [UsersService, GdprService, UsersScheduler, GdprScheduler],
  exports: [UsersService, GdprService],
})
export class UsersModule {}
