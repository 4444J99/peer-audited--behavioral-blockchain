import { Controller, Get, Post, Body, Param, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "../../../guards/auth.guard";
import { BehavioralEnhancementsService } from "./behavioral-enhancements.service";
import { BehavioralEnrichmentService } from "./behavioral-enrichment.service";
import { DecoCommitmentService } from "./deco-commitment.service";
import {
  LifeTransitionType, ImplementationIntention, OathCategory, PassiveProvider,
} from "../../../../shared/libs/behavioral-logic";

// The bootstrap middleware sets req.id to a correlation ID, so the
// authenticated principal must be read from req.user (set by AuthGuard).
function resolveUserId(req: any): string {
  return req?.user?.id ?? req?.userId;
}

@Controller("behavioral")
@UseGuards(AuthGuard)
export class BehavioralController {
  constructor(
    private readonly enhancements: BehavioralEnhancementsService,
    private readonly enrichment: BehavioralEnrichmentService,
    private readonly decoCommitment: DecoCommitmentService,
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

  @Get("temptation-bundles/:category?")
  getTemptationBundles(@Param("category") category?: string) {
    return this.enrichment.getTemptationBundles(category);
  }

  @Get("recovery-state/:contractId")
  async recoveryState(@Param("contractId") contractId: string) {
    return this.enrichment.getRecoveryState(contractId);
  }

  @Get("stake-taper/:contractId")
  async stakeTaper(@Param("contractId") contractId: string) {
    return this.enrichment.getStakeTaper(contractId);
  }

  @Post("disenchantment/:contractId")
  async recordDisenchantment(
    @Param("contractId") contractId: string,
    @Body() body: { rating: number },
    @Req() req: any,
  ) {
    return this.enrichment.recordDisenchantmentRating(resolveUserId(req), contractId, body.rating);
  }

  @Get("disenchantment/:contractId")
  async disenchantmentTrend(@Param("contractId") contractId: string) {
    return this.enrichment.getDisenchantmentTrend(contractId);
  }

  @Get("discontinuity-window/:type/:days")
  async discontinuityWindow(
    @Param("type") type: string,
    @Param("days") days: string,
  ) {
    return this.enrichment.getDiscontinuityWindow(type as LifeTransitionType, parseInt(days, 10));
  }

  @Post("implementation-intention/parse")
  async parseIntention(@Body() body: { raw: string }) {
    return this.enrichment.parseImplIntention(body.raw);
  }

  @Post("implementation-intention/validate")
  async validateIntention(@Body() body: { intention: ImplementationIntention }) {
    return this.enrichment.validateImplIntention(body.intention);
  }

  @Get("implementation-intention/template/:category")
  async intentionTemplate(@Param("category") category: string) {
    return { template: this.enrichment.getImplementationIntentionTemplate(category as OathCategory) };
  }

  // #108: Passive proof providers
  @Get("passive-providers")
  getPassiveProviders() { return this.enrichment.getPassiveProviders(); }

  @Get("passive-providers/:provider/config")
  getPassiveProviderConfig(@Param("provider") provider: string) {
    return this.enrichment.getPassiveProviderConfig(provider as PassiveProvider);
  }

  // #107: Emotional contagion safeguards
  @Post("pod/broadcast-evaluate")
  evaluatePodBroadcast(@Body() body: { podId: string; failureCount: number; memberCount: number; lastBroadcastAt: string | null }) {
    return this.enrichment.evaluatePodBroadcast(body.podId, body.failureCount, body.memberCount, body.lastBroadcastAt ? new Date(body.lastBroadcastAt) : null);
  }

  // #106: Auditor wellness
  @Post("auditor/wellness")
  assessAuditorWellness(@Body() body: { auditorId: string; consecutiveReviews: number; avgReviewTimeSec: number; recentRejectionRate: number }) {
    return this.enrichment.assessAuditorWellness(body.auditorId, body.consecutiveReviews, body.avgReviewTimeSec, body.recentRejectionRate);
  }

  // #105: Generosity loop
  @Get("generosity-grant/:completedContracts/:avgStakeCents")
  getGenerosityGrant(@Param("completedContracts") completedContracts: string, @Param("avgStakeCents") avgStakeCents: string) {
    return this.enrichment.calculateGenerosityGrant(parseInt(completedContracts, 10), parseInt(avgStakeCents, 10));
  }

  // #104: Contract rollover
  @Post("contract-rollover")
  getContractRollover(@Body() body: { category: string; stakeCents: number }) {
    return this.enrichment.generateRolloverOffer(body.category, body.stakeCents);
  }

  // #103: Academy
  @Post("academy/progress")
  getAcademyProgress(@Body() body: { completedIds: string[] }) {
    return this.enrichment.getAcademyProgress(body.completedIds);
  }

  // #100: Resistance patterns
  @Post("resistance-patterns")
  detectResistance(@Body() body: { text: string }) {
    return this.enrichment.detectResistancePatterns(body.text);
  }

  // #93: Intake assessment
  @Get("intake-assessment")
  getIntakeAssessment() { return this.enrichment.getIntakeAssessment(); }

  @Post("intake-assessment/profile")
  calculateProfile(@Body() body: { answers: Record<string, number> }) {
    return this.enrichment.calculateAssessmentProfile(body.answers);
  }

  // #92: DECO oracle stub
  @Post("deco-proof")
  async createDecoProof(@Req() req: any, @Body() body: { url: string; selector: string; expectedValue: string }) {
    return this.decoCommitment.createCommitment(body, resolveUserId(req));
  }

  // #91: Oracle failure fallback
  @Post("oracle-resolve")
  resolveOracle(@Body() body: { verdicts: any[] }) {
    return this.enrichment.resolveOracleFailure(body.verdicts);
  }

  // #90: Stablecoin quote
  @Get("stablecoin-quote/:usdCents/:stablecoinType")
  getStablecoinQuote(@Param("usdCents") usdCents: string, @Param("stablecoinType") stablecoinType: string) {
    return this.enrichment.quoteStablecoinStake(parseInt(usdCents, 10), stablecoinType as 'USDC' | 'USDT');
  }

  // #89: Revenue share
  @Post("revenue-share")
  calculateRevenueShare(@Body() body: { totalPoolCents: number; totalDataPoints: number; userDataPoints: number }) {
    return this.enrichment.calculateRevenueShare(body.totalPoolCents, body.totalDataPoints, body.userDataPoints);
  }

  // #88: Whistleblower
  @Post("whistleblower-report")
  createWhistleblowerReport(@Body() body: { category: 'FRAUD' | 'ABUSE' | 'COLLUSION' | 'OTHER' }) {
    return this.enrichment.createWhistleblowerReport(body.category);
  }
}
