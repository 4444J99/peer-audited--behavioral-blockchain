import { Module, forwardRef } from '@nestjs/common';
import { OraclesController } from './oracles.controller';
import { HealthKitGuardService } from '../compliance/healthkit-guard.service';
import { ContractsModule } from '../contracts/contracts.module';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

@Module({
  imports: [
    forwardRef(() => ContractsModule),
  ],
  controllers: [OraclesController],
  providers: [
    HealthKitGuardService,
    LedgerService,
    TruthLogService,
  ],
  exports: [HealthKitGuardService],
})
export class OraclesModule {}
