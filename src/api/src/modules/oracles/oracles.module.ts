import { Module, forwardRef } from '@nestjs/common';
import { OraclesController } from './oracles.controller';
import { HealthKitGuardService } from '../compliance/healthkit-guard.service';
import { ContractsModule } from '../contracts/contracts.module';
import { LedgerModule } from '../../../services/ledger/ledger.module';

@Module({
  imports: [
    forwardRef(() => ContractsModule),
    LedgerModule,
  ],
  controllers: [OraclesController],
  providers: [HealthKitGuardService],
  exports: [HealthKitGuardService],
})
export class OraclesModule {}
