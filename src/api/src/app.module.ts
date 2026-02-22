import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { FuryModule } from './modules/fury/fury.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    DatabaseModule,
    ContractsModule,
    FuryModule,
    WalletModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
