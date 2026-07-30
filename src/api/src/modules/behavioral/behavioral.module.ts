import { Module, forwardRef } from "@nestjs/common";
import { BehavioralEnhancementsService } from "./behavioral-enhancements.service";
import { BehavioralEnrichmentService } from "./behavioral-enrichment.service";
import { BehavioralController } from "./behavioral.controller";
import { RecoveryStatusCalculator } from "./recovery-status.calculator";
import { OstrichDetectionService } from "./ostrich-detection.service";
import { OstrichScheduler } from "./ostrich-scheduler";
import { ChurnDetectionService } from "./churn-detection.service";
import { DifficultyCalibrationService } from "./difficulty-calibration.service";
import { DangerZoneService } from "./danger-zone.service";
import { AccountabilityPartnerService } from "./accountability-partner.service";
import { ProgressDashboardService } from "./progress-dashboard.service";
import { EndowedProgressService } from "./endowed-progress.service";
import { DecoCommitmentService } from "./deco-commitment.service";
import { PractitionerIntelligenceService } from "./practitioner-intelligence.service";
import { PractitionerController } from "./practitioner.controller";
import { RetentionController } from "./retention.controller";
import { RetentionScheduler } from "./retention.scheduler";
import { RoleGuard } from "../../common/guards/role.guard";
import { ContractsModule } from "../contracts/contracts.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [forwardRef(() => ContractsModule), NotificationsModule],
  controllers: [BehavioralController, PractitionerController, RetentionController],
  providers: [
    BehavioralEnhancementsService,
    BehavioralEnrichmentService,
    RecoveryStatusCalculator,
    OstrichDetectionService,
    OstrichScheduler,
    DifficultyCalibrationService,
    ChurnDetectionService,
    DangerZoneService,
    AccountabilityPartnerService,
    ProgressDashboardService,
    EndowedProgressService,
    DecoCommitmentService,
    PractitionerIntelligenceService,
    RetentionScheduler,
    RoleGuard,
  ],
  exports: [
    BehavioralEnhancementsService,
    BehavioralEnrichmentService,
    RecoveryStatusCalculator,
    OstrichDetectionService,
    DifficultyCalibrationService,
    DangerZoneService,
    AccountabilityPartnerService,
    ProgressDashboardService,
    EndowedProgressService,
    DecoCommitmentService,
    PractitionerIntelligenceService,
  ],
})
export class BehavioralModule {}
