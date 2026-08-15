import { Module, forwardRef } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ContractsController } from "./contracts.controller";
import { FitbitController } from "./fitbit.controller";
import { FitbitWebhookController } from "./fitbit-webhook.controller";
import { ContractsService } from "./contracts.service";
import { ContractsScheduler } from "./contracts.scheduler";
import { AttestationScheduler } from "./attestation.scheduler";
import { LedgerService } from "../../../services/ledger/ledger.service";
import { TruthLogService } from "../../../services/ledger/truth-log.service";
import { DisputeService } from "../../../services/escrow/dispute.service";
import { FuryRouterService } from "../../../services/fury-router/fury-router.service";
import { AegisProtocolService } from "../../../services/health/aegis.service";
import { RecoveryProtocolService } from "../../../services/health/recovery-protocol.service";
import { DynamicPenaltyService } from "../../../services/health/dynamic-penalty.service";
import { FitbitService } from "../../../services/health/fitbit.service";
import { FitbitSyncService } from "../../../services/health/fitbit-sync.service";
import { HoneypotService } from "../../../services/intelligence/honeypot.service";
import { PodOrchestrationService } from "./pod-orchestration.service";

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
import { EscrowModule } from "../payments/escrow.module";
import { PayModule } from "../pay/pay.module";
import { ReferralModule } from "../referrals/referral.module";
import { EmailModule } from "../email/email.module";
import { B2BModule } from "../b2b/b2b.module";
import { OnboardingModule } from "../onboarding/onboarding.module";
import Redis from "ioredis";
import { resolveCacheRedisConfig } from "../../config/runtime";

const redisProvider = {
  provide: ANOMALY_REDIS_CLIENT,
  useFactory: () => {
    try {
      const config = resolveCacheRedisConfig();
      if (!config) return undefined;
      return new Redis({ ...config, lazyConnect: true });
    } catch {
      return undefined;
    }
  },
};

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
    ReferralModule,
    EmailModule,
    OnboardingModule,
    PayModule,
    // Contract resolution fans out to enterprise webhook subscribers; B2BModule
    // owns that store and its delivery queue. It imports nothing, so this edge
    // is one-way and needs no forwardRef.
    B2BModule,
    forwardRef(() => PaymentsModule),
    EscrowModule,
  ],
  controllers: [ContractsController, FitbitController, FitbitWebhookController],
  providers: [
    ContractsService,
    ContractsScheduler,
    AttestationScheduler,
    LedgerService,
    TruthLogService,
    DisputeService,
    FuryRouterService,
    AegisProtocolService,
    RecoveryProtocolService,
    DynamicPenaltyService,
    FitbitService,
    FitbitSyncService,
    HoneypotService,
    PodOrchestrationService,
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
