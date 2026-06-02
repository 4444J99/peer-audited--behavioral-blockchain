import { Module, forwardRef } from "@nestjs/common";
import { BehavioralEnhancementsService } from "./behavioral-enhancements.service";
import { BehavioralController } from "./behavioral.controller";
import { ContractsModule } from "../contracts/contracts.module";

@Module({
  imports: [forwardRef(() => ContractsModule)],
  controllers: [BehavioralController],
  providers: [BehavioralEnhancementsService],
  exports: [BehavioralEnhancementsService],
})
export class BehavioralModule {}
