import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersScheduler } from './users.scheduler';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [UsersController],
  providers: [UsersService, UsersScheduler],
  exports: [UsersService],
})
export class UsersModule {}
