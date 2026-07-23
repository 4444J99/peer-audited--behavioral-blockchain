import { Module, forwardRef } from "@nestjs/common";
import { BehavioralEnhancementsService } from "./behavioral-enhancements.service";
import { BehavioralEnrichmentService } from "./behavioral-enrichment.service";
import { BehavioralController } from "./behavioral.controller";
import { RecoveryStatusCalculator } from "./recovery-status.calculator";
import { OstrichDetectionService } from "./ostrich-detection.service";
import { OstrichScheduler } from "./ostrich-scheduler";
import { ChurnDetectionService } from "./churn-detection.service";
import { DifficultyCalibrationService } from "./difficulty-calibration.service";
import { ContractsModule } from "../contracts/contracts.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [forwardRef(() => ContractsModule), NotificationsModule],
  controllers: [BehavioralController],
  providers: [
    BehavioralEnhancementsService,
    BehavioralEnrichmentService,
    RecoveryStatusCalculator,
    OstrichDetectionService,
    OstrichScheduler,
    DifficultyCalibrationService,
    ChurnDetectionService,
  ],
  exports: [
    BehavioralEnhancementsService,
    BehavioralEnrichmentService,
    RecoveryStatusCalculator,
    OstrichDetectionService,
    DifficultyCalibrationService,
  ],
})
export class BehavioralModule {}
