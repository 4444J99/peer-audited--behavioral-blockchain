import { Module } from "@nestjs/common";
import { TruthLogService } from "../../../services/ledger/truth-log.service";
import { RoleGuard } from "../../common/guards/role.guard";
import { DatabaseModule } from "../../database/database.module";
import { AgentActionEvidenceController } from "./agent-action-evidence.controller";
import { AgentActionEvidenceService } from "./agent-action-evidence.service";

@Module({
  imports: [DatabaseModule],
  controllers: [AgentActionEvidenceController],
  providers: [AgentActionEvidenceService, TruthLogService, RoleGuard],
  exports: [AgentActionEvidenceService],
})
export class AgentActionEvidenceModule {}
