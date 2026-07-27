import { Module } from "@nestjs/common";
import { CrisisController } from "./crisis.controller";
import { CrisisDetectionService } from "../../../services/security/crisis-detection.service";
import { CrisisInterventionService } from "../../../services/security/crisis-intervention.service";
import { CrisisNotificationService } from "../../../services/security/crisis-notification.service";

@Module({
  controllers: [CrisisController],
  providers: [
    CrisisDetectionService,
    CrisisInterventionService,
    CrisisNotificationService,
  ],
  exports: [CrisisDetectionService, CrisisInterventionService],
})
export class CrisisModule {}
