import { Controller, Get, Post, Body, Param, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "../../../guards/auth.guard";
import { BehavioralEnhancementsService } from "./behavioral-enhancements.service";
import { BehavioralEnrichmentService } from "./behavioral-enrichment.service";

function resolveUserId(req: any): string {
  return req?.id ?? req?.user?.id ?? req?.userId;
}

@Controller("behavioral")
@UseGuards(AuthGuard)
export class BehavioralController {
  constructor(
    private readonly enhancements: BehavioralEnhancementsService,
    private readonly enrichment: BehavioralEnrichmentService,
  ) {}

  @Post("device/subscribe")
  async subscribe(@Req() req: any, @Body("deviceId") deviceId: string) {
    return this.enhancements.subscribeToDevice(resolveUserId(req), deviceId);
  }

  @Post("device/unsubscribe")
  async unsubscribe(@Req() req: any, @Body("deviceId") deviceId: string) {
    return this.enhancements.unsubscribeFromDevice(resolveUserId(req), deviceId);
  }

  @Post("propose-swap")
  async proposeSwap(
    @Req() req: any,
    @Body() body: { sourceContractId: string; targetOathCategory: string; carryOverPct: number },
  ) {
    return this.enhancements.proposeBehaviorSwap(
      resolveUserId(req),
      body.sourceContractId,
      body.targetOathCategory,
      body.carryOverPct,
    );
  }

  @Get("bbo/:category")
  getBbo(@Param("category") category: string) {
    return this.enrichment.getBboRecommendations(category);
  }

  @Get("micro-reward")
  getMicroReward() {
    return this.enrichment.getMicroReward();
  }

  @Post("friction-audit")
  async frictionAudit(@Body() body: { answers: Record<string, number> }, @Req() req: any) {
    return this.enrichment.frictionAudit(resolveUserId(req), body.answers);
  }

  @Get("habit-strength")
  async habitStrength(@Req() req: any) {
    return this.enrichment.getHabitStrength(resolveUserId(req));
  }

  @Get("gateway-oath/eligibility")
  async gatewayEligibility(@Req() req: any) {
    return this.enrichment.checkGatewayOathEligibility(resolveUserId(req), 100, 7);
  }

  @Get("reentry/eligibility")
  async reentryEligibility(@Req() req: any) {
    return this.enrichment.checkReentryEligibility(resolveUserId(req));
  }

  @Get("cm-reward/:day")
  getCmReward(@Param("day") day: string) {
    return { rewardCents: this.enrichment.getCmReward(parseInt(day, 10)) };
  }

  @Post("exit-interview/:contractId")
  async submitExitInterview(
    @Param("contractId") contractId: string,
    @Body() body: { answers: Record<string, any> },
    @Req() req: any,
  ) {
    return this.enrichment.submitExitInterview(contractId, resolveUserId(req), body.answers);
  }

  @Get("exit-interview/questions/:outcome")
  getExitQuestions(@Param("outcome") outcome: string) {
    return this.enrichment.getExitInterviewQuestions(outcome as "COMPLETED" | "FAILED");
  }

  @Get("day21/:contractId")
  async checkDay21(@Param("contractId") contractId: string) {
    return this.enrichment.checkDay21Milestone(contractId);
  }

  @Get("abandonment-classification")
  async classifyAbandonment(@Req() req: any) {
    return this.enrichment.classifyAbandonment(resolveUserId(req));
  }
}
