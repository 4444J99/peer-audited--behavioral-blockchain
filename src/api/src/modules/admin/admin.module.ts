import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AdminController } from "./admin.controller";
import { UserModerationController } from "./user-moderation.controller";
import { AdminScheduler } from "./admin.scheduler";
import { ModerationService } from "../../../services/security/moderation.service";
import { CrisisDetectionService } from "../../../services/security/crisis-detection.service";
import { CrisisInterventionService } from "../../../services/security/crisis-intervention.service";
import { CrisisNotificationService } from "../../../services/security/crisis-notification.service";
import { HoneypotService } from "../../../services/intelligence/honeypot.service";
import { AnomalyService } from "../../../services/anomaly/anomaly.service";
import { TruthLogService } from "../../../services/ledger/truth-log.service";
import { FuryRouterService } from "../../../services/fury-router/fury-router.service";
import { RoleGuard } from "../../common/guards/role.guard";
import { ContractsModule } from "../contracts/contracts.module";
import { ProofsModule } from "../proofs/proofs.module";
import { PaymentsModule } from "../payments/payments.module";
import { EscrowModule } from "../payments/escrow.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ContractsModule,
    ProofsModule,
    PaymentsModule,
    EscrowModule,
  ],
  controllers: [AdminController, UserModerationController],
  providers: [
    ModerationService,
    CrisisDetectionService,
    CrisisInterventionService,
    CrisisNotificationService,
    HoneypotService,
    AnomalyService,
    TruthLogService,
    FuryRouterService,
    RoleGuard,
    AdminScheduler,
  ],
})
export class AdminModule {}
