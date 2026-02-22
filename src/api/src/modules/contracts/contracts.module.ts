import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { AegisProtocolService } from '../../../services/health/aegis.service';

@Module({
  controllers: [ContractsController],
  providers: [
    ContractsService,
    LedgerService,
    TruthLogService,
    StripeFboService,
    FuryRouterService,
    AegisProtocolService,
  ],
  exports: [ContractsService],
})
export class ContractsModule {}
