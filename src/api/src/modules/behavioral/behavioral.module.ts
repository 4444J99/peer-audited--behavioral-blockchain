import { Module, forwardRef } from "@nestjs/common";
import { BehavioralEnhancementsService } from "./behavioral-enhancements.service";
import { ContractsModule } from "../contracts/contracts.module";

@Module({
  imports: [forwardRef(() => ContractsModule)],
  providers: [BehavioralEnhancementsService],
  exports: [BehavioralEnhancementsService],
})
export class BehavioralModule {}
