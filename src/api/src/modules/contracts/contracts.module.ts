import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractsScheduler } from './contracts.scheduler';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { DisputeService } from '../../../services/escrow/dispute.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { AegisProtocolService } from '../../../services/health/aegis.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule],
  controllers: [ContractsController],
  providers: [
    ContractsService,
    ContractsScheduler,
    LedgerService,
    TruthLogService,
    StripeFboService,
    DisputeService,
    FuryRouterService,
    AegisProtocolService,
    AnomalyService,
  ],
  exports: [ContractsService],
})
export class ContractsModule {}
