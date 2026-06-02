import { Module, forwardRef } from "@nestjs/common";
import { BehavioralEnhancementsService } from "./behavioral-enhancements.service";
import { BehavioralController } from "./behavioral.controller";
import { RecoveryStatusCalculator } from "./recovery-status.calculator";
import { ContractsModule } from "../contracts/contracts.module";

@Module({
  imports: [forwardRef(() => ContractsModule)],
  controllers: [BehavioralController],
  providers: [BehavioralEnhancementsService, RecoveryStatusCalculator],
  exports: [BehavioralEnhancementsService, RecoveryStatusCalculator],
})
export class BehavioralModule {}
