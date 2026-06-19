import { Module, forwardRef } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ContractsController } from "./contracts.controller";
import { ContractsService } from "./contracts.service";
import { ContractsScheduler } from "./contracts.scheduler";
import { AttestationScheduler } from "./attestation.scheduler";
import { LedgerService } from "../../../services/ledger/ledger.service";
import { TruthLogService } from "../../../services/ledger/truth-log.service";
import { StripeFboService } from "../../../services/escrow/stripe.service";
import { DisputeService } from "../../../services/escrow/dispute.service";
import { FuryRouterService } from "../../../services/fury-router/fury-router.service";
import { AegisProtocolService } from "../../../services/health/aegis.service";
import { RecoveryProtocolService } from "../../../services/health/recovery-protocol.service";
import { DynamicPenaltyService } from "../../../services/health/dynamic-penalty.service";
import { HoneypotService } from "../../../services/intelligence/honeypot.service";

import { SurveyService } from "./survey.service";
import { WaitlistService } from "./waitlist.service";
import { BannedUserGuard } from "../../guards/banned-user.guard";
import { TierGuard } from "../../guards/tier.guard";
import {
  AnomalyService,
  ANOMALY_REDIS_CLIENT,
} from "../../../services/anomaly/anomaly.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsModule } from "../payments/payments.module";
import { EmailModule } from "../email/email.module";
import Redis from "ioredis";
import { getRedisConnectionConfig } from "../../../config/queue.config";

const redisProvider = {
  provide: ANOMALY_REDIS_CLIENT,
  useFactory: () => {
    try {
      return new Redis({ ...getRedisConnectionConfig(), lazyConnect: true });
    } catch {
      return undefined;
    }
  },
};

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
    EmailModule,
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
    SurveyService,
    WaitlistService,
    BannedUserGuard,
    TierGuard,

    AnomalyService,
    redisProvider,
  ],
  exports: [ContractsService, HoneypotService, DisputeService, TruthLogService],
})
export class ContractsModule {}
