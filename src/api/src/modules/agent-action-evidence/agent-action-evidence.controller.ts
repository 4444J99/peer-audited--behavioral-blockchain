import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../../../guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RoleGuard, Roles } from "../../common/guards/role.guard";
import { AgentActionEvidenceService } from "./agent-action-evidence.service";
import {
  OpenDisputeDto,
  ProposeAgentActionDto,
  RecordApprovalDto,
  RecordMutationDto,
  RecordPeerReviewDto,
  RecordRollbackDto,
  RecordVerificationDto,
} from "./dto";

@ApiTags("Agent Action Evidence")
@ApiBearerAuth()
@Controller("agent-actions")
@UseGuards(AuthGuard, RoleGuard)
@Roles("ADMIN")
export class AgentActionEvidenceController {
  constructor(private readonly evidence: AgentActionEvidenceService) {}

  @Post(":executionId/proposal")
  @ApiOperation({
    summary:
      "Record a proposed agent action; this endpoint never executes the mutation",
  })
  propose(
    @Param("executionId") executionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ProposeAgentActionDto,
  ) {
    return this.evidence.propose(executionId, dto, user.id);
  }

  @Post(":executionId/approval")
  @ApiOperation({
    summary:
      "Record a human approval or rejection without executing the proposed action",
  })
  recordApproval(
    @Param("executionId") executionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RecordApprovalDto,
  ) {
    return this.evidence.recordApproval(executionId, dto, user.id);
  }

  @Post(":executionId/mutation")
  @ApiOperation({
    summary:
      "Record the receipt of a mutation performed by an external executor",
  })
  recordMutation(
    @Param("executionId") executionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RecordMutationDto,
  ) {
    return this.evidence.recordMutation(executionId, dto, user.id);
  }

  @Post(":executionId/verification")
  @ApiOperation({ summary: "Record post-mutation verification evidence" })
  recordVerification(
    @Param("executionId") executionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RecordVerificationDto,
  ) {
    return this.evidence.recordVerification(executionId, dto, user.id);
  }

  @Post(":executionId/rollback")
  @ApiOperation({
    summary: "Record a rollback result performed by an external executor",
  })
  recordRollback(
    @Param("executionId") executionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RecordRollbackDto,
  ) {
    return this.evidence.recordRollback(executionId, dto, user.id);
  }

  @Post(":executionId/disputes")
  @ApiOperation({
    summary: "Open a dispute against the recorded execution evidence",
  })
  openDispute(
    @Param("executionId") executionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: OpenDisputeDto,
  ) {
    return this.evidence.openDispute(executionId, dto, user.id);
  }

  @Post(":executionId/peer-review")
  @ApiOperation({
    summary: "Record the peer-review finding for an open dispute",
  })
  recordPeerReview(
    @Param("executionId") executionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RecordPeerReviewDto,
  ) {
    return this.evidence.recordPeerReview(executionId, dto, user.id);
  }

  @Get(":executionId")
  @ApiOperation({
    summary: "Read an execution record and verify its event hash chain",
  })
  getExecution(@Param("executionId") executionId: string) {
    return this.evidence.getExecution(executionId);
  }
}
