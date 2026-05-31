import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "../../../guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CrisisInterventionService } from "../../../services/security/crisis-intervention.service";
import { CrisisDetectionService } from "../../../services/security/crisis-detection.service";
import { CrisisEscalateDto } from "./dto";

@ApiTags("Crisis")
@ApiBearerAuth()
@Controller("crisis")
@UseGuards(AuthGuard)
export class CrisisController {
  constructor(
    private readonly crisisDetection: CrisisDetectionService,
    private readonly crisisIntervention: CrisisInterventionService,
  ) {}

  @Post("escalate")
  @ApiOperation({ summary: "Submit a self-report crisis escalation" })
  async escalate(
    @Body() body: CrisisEscalateDto,
    @CurrentUser() user: { id: string },
  ) {
    const targetUserId = user.id;
    const trigger = body.trigger || "self-report";
    const detection = this.crisisDetection.analyzeContent(trigger);
    const storedSeverity =
      detection.severity !== "NONE" ? detection.severity : "HIGH";
    const detectionOnly = detection.severity !== "NONE" ? detection : undefined;
    return this.crisisIntervention.reportCrisis(
      targetUserId,
      trigger,
      detectionOnly,
    );
  }
}
