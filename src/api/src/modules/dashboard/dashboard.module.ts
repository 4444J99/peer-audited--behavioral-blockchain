import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UnitEconomicsService } from './unit-economics.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [DashboardController],
  providers: [DashboardService, UnitEconomicsService],
  exports: [DashboardService, UnitEconomicsService],
})
export class DashboardModule {}

