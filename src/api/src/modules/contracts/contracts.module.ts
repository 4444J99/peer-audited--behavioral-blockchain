import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractsScheduler } from './contracts.scheduler';
import { AttestationScheduler } from './attestation.scheduler';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { DisputeService } from '../../../services/escrow/dispute.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { AegisProtocolService } from '../../../services/health/aegis.service';
import { RecoveryProtocolService } from '../../../services/health/recovery-protocol.service';
import { DynamicPenaltyService } from '../../../services/health/dynamic-penalty.service';
import { HoneypotService } from '../../../services/intelligence/honeypot.service';

import { AnomalyService, ANOMALY_REDIS_CLIENT } from '../../../services/anomaly/anomaly.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import Redis from 'ioredis';
import { REDIS_CONNECTION_CONFIG } from '../../../config/queue.config';

const redisProvider = {
  provide: ANOMALY_REDIS_CLIENT,
  useFactory: () => {
    try {
      return new Redis({ ...REDIS_CONNECTION_CONFIG, lazyConnect: true });
    } catch {
      return undefined;
    }
  },
};

@Module({
  imports: [
    ScheduleModule.forRoot(), 
    NotificationsModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [ContractsController],
  providers: [
    ContractsService,
    ContractsScheduler,
    AttestationScheduler,
    LedgerService,
    TruthLogService,
    StripeFboService,
    DisputeService,
    FuryRouterService,
    AegisProtocolService,
    RecoveryProtocolService,
    DynamicPenaltyService,
    HoneypotService,

    AnomalyService,
    redisProvider,
  ],
  exports: [ContractsService, HoneypotService, DisputeService, TruthLogService],
})
export class ContractsModule {}
