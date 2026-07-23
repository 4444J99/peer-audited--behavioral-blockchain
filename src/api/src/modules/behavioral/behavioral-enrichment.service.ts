import { Injectable, Logger } from "@nestjs/common";
import { Pool } from "pg";
import {
  validateGatewayOath, calculateStakeTaper, getCmRewardForDay, calculateMicroReward,
  calculateHabitStrength, getHabitStrengthLabel, getBboRecommendations, calculateFrictionScore,
  classifyAbandonment, checkReentryEligibility,
  EXIT_INTERVIEW_QUESTIONS_SUCCESS, EXIT_INTERVIEW_QUESTIONS_FAILURE,
  DAY21_TARGET_DAY, DAY21_BONUS_INTEGRITY_POINTS, DAY21_VAULT_BONUS_CENTS, DAY21_BADGE_NAME,
  BboEntry, TemptationBundle, getTemptationBundles, getRecoveryState, RecoveryState,
  DisenchantmentEntry, DisenchantmentResult, calculateDisenchantment,
  LifeTransitionType, DiscontinuityWindow, detectDiscontinuityWindow,
  ImplementationIntention, ImplementationIntentionValidation,
  parseImplementationIntention, validateImplementationIntention, generateImplementationIntentionTemplate,
  OathCategory,
  PassiveProvider, getPassiveProviders, getPassiveProviderConfig,
  evaluatePodBroadcast, assessAuditorWellness, calculateGenerosityGrant,
  generateRolloverOffer, getAcademyProgress, detectResistancePatterns,
  INTAKE_ASSESSMENT, calculateAssessmentProfile, createDecoProof,
  resolveOracleFailure, quoteStablecoinStake, calculateRevenueShare,
  createWhistleblowerReport,
} from "../../../../shared/libs/behavioral-logic";

@Injectable()
export class BehavioralEnrichmentService {
  private readonly logger = new Logger(BehavioralEnrichmentService.name);

  constructor(private readonly pool: Pool) {}

  async checkGatewayOathEligibility(userId: string, stakeCents: number, durationDays: number) {
    const { rows } = await this.pool.query(
      `SELECT COUNT(*)::int AS count FROM contracts WHERE user_id = $1`,
      [userId],
    );
    return validateGatewayOath({
      totalContracts: rows[0]?.count ?? 0,
      requestedStakeCents: stakeCents,
      requestedDurationDays: durationDays,
    });
  }

  async getStakeTaper(contractId: string) {
    const { rows } = await this.pool.query(
      `SELECT stake_amount, EXTRACT(WEEK FROM NOW() - started_at)::int AS weeks_elapsed
       FROM contracts WHERE id = $1 AND status = 'ACTIVE'`,
      [contractId],
    );
    if (!rows[0]) return null;
    return calculateStakeTaper(
      Math.round(parseFloat(rows[0].stake_amount) * 100),
      rows[0].weeks_elapsed,
    );
  }

  getCmReward(day: number): number {
    return getCmRewardForDay(day);
  }

  getMicroReward(): { base: number; bonus: number; total: number } {
    return calculateMicroReward();
  }

  async getHabitStrength(userId: string) {
    const { rows } = await this.pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status IN ('ATTESTED','COSIGNED'))::int AS completed,
        COUNT(*)::int AS total
       FROM attestations a
       JOIN contracts c ON c.id = a.contract_id
       WHERE c.user_id = $1`,
      [userId],
    );
    if (!rows[0] || rows[0].total === 0) return { strength: 0, label: "Fragile" };
    const strength = calculateHabitStrength(rows[0].completed, rows[0].total);
    return { strength: Math.round(strength * 100) / 100, label: getHabitStrengthLabel(strength) };
  }

  getBboRecommendations(category: string, count = 3): BboEntry[] {
    return getBboRecommendations(category, count);
  }

  async frictionAudit(userId: string, answers: Record<string, number>) {
    const result = calculateFrictionScore(answers);
    await this.pool.query(
      `UPDATE users SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{friction_audit}', $1::jsonb)
       WHERE id = $2`,
      [JSON.stringify({ answers, result, auditedAt: new Date().toISOString() }), userId],
    );
    return result;
  }

  classifyAbandonment(userId: string) {
    return this.pool.query(
      `SELECT
        COALESCE((SELECT COUNT(*) FILTER (WHERE status = 'COMPLETED')::int FROM contracts WHERE user_id = $1), 0) AS completed,
        COALESCE((SELECT COUNT(*) FILTER (WHERE status = 'FAILED')::int FROM contracts WHERE user_id = $1), 0) AS failed,
        COALESCE((SELECT COUNT(*)::int FROM support_tickets WHERE user_id = $1), 0) AS tickets`,
      [userId],
    ).then(({ rows }) => {
      const r = rows[0];
      return classifyAbandonment({
        completedContracts: r.completed,
        failedContracts: r.failed,
        averageCompletionRate: (r.completed + r.failed) > 0 ? r.completed / (r.completed + r.failed) : 0,
        daysSinceLastActive: 0,
        streakAtExit: 0,
        integrityScore: 0,
        supportTicketsOpened: r.tickets,
      });
    });
  }

  async checkReentryEligibility(userId: string) {
    const { rows } = await this.pool.query(
      `SELECT COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failures,
              COALESCE(MAX(updated_at) FILTER (WHERE status = 'FAILED'), NOW())::timestamp AS last_failure,
              COALESCE(MAX(stake_amount) FILTER (WHERE status = 'FAILED'), '0') AS last_stake
       FROM contracts WHERE user_id = $1`,
      [userId],
    );
    const r = rows[0];
    const daysSinceFail = Math.floor(
      (Date.now() - new Date(r.last_failure).getTime()) / 86400000,
    );
    return checkReentryEligibility({
      daysSinceLastFailure: daysSinceFail,
      previousFailureCount: r.failures,
      previousStakeCents: Math.round(parseFloat(r.last_stake) * 100),
    });
  }

  getExitInterviewQuestions(outcome: "COMPLETED" | "FAILED") {
    return outcome === "COMPLETED" ? EXIT_INTERVIEW_QUESTIONS_SUCCESS : EXIT_INTERVIEW_QUESTIONS_FAILURE;
  }

  async submitExitInterview(contractId: string, userId: string, answers: Record<string, any>) {
    const { rows: [row] } = await this.pool.query(
      `INSERT INTO exit_interviews (contract_id, user_id, answers)
       VALUES ($1, $2, $3)
       ON CONFLICT (contract_id) DO UPDATE SET answers = $3, updated_at = NOW()
       RETURNING id`,
      [contractId, userId, JSON.stringify(answers)],
    );
    this.logger.log(`Exit interview submitted for contract ${contractId} (id=${row.id})`);
    return { id: row.id };
  }

  getTemptationBundles(category?: string): TemptationBundle[] {
    return getTemptationBundles(category);
  }

  async getRecoveryState(contractId: string) {
    const { rows } = await this.pool.query(
      `SELECT EXTRACT(DAY FROM NOW() - started_at)::int AS age_days FROM contracts WHERE id = $1`,
      [contractId],
    );
    if (!rows[0]) return null;
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    return { state: getRecoveryState(rows[0].age_days, isWeekend), ageDays: rows[0].age_days };
  }

  async recordDisenchantmentRating(userId: string, contractId: string, rating: number) {
    const { rows } = await this.pool.query(
      `INSERT INTO disenchantment_ratings (user_id, contract_id, rating)
       VALUES ($1, $2, $3) RETURNING id, created_at`,
      [userId, contractId, rating],
    );
    this.logger.log(`Disenchantment rating ${rating} recorded for contract ${contractId}`);
    return rows[0];
  }

  async getDisenchantmentTrend(contractId: string): Promise<DisenchantmentResult> {
    const { rows } = await this.pool.query(
      `SELECT rating, created_at::date::text AS date
       FROM disenchantment_ratings WHERE contract_id = $1
       ORDER BY created_at ASC`,
      [contractId],
    );
    return calculateDisenchantment(rows as DisenchantmentEntry[]);
  }

  getDiscontinuityWindow(transitionType: LifeTransitionType, daysSinceTransition: number): DiscontinuityWindow {
    return detectDiscontinuityWindow({ transitionType, daysSinceTransition });
  }

  parseImplIntention(raw: string): ImplementationIntention | null {
    return parseImplementationIntention(raw);
  }

  validateImplIntention(intention: ImplementationIntention): ImplementationIntentionValidation {
    return validateImplementationIntention(intention);
  }

  getImplementationIntentionTemplate(category: OathCategory): string {
    return generateImplementationIntentionTemplate(category);
  }

  async checkDay21Milestone(contractId: string) {
    const { rows } = await this.pool.query(
      `SELECT user_id, EXTRACT(DAY FROM NOW() - started_at)::int AS age_days, stake_amount
       FROM contracts WHERE id = $1 AND status = 'ACTIVE'`,
      [contractId],
    );
    if (!rows[0]) return null;
    const ageDays = rows[0].age_days;
    if (ageDays !== DAY21_TARGET_DAY) return { day21Reached: false, ageDays };
    await this.pool.query(
      `UPDATE users SET integrity_score = integrity_score + $1 WHERE id = $2`,
      [DAY21_BONUS_INTEGRITY_POINTS, rows[0].user_id],
    );
    this.logger.log(`Day 21 milestone reward applied for contract ${contractId}`);
    return {
      day21Reached: true,
      ageDays,
      integrityBonus: DAY21_BONUS_INTEGRITY_POINTS,
      vaultBonusCents: DAY21_VAULT_BONUS_CENTS,
      badge: DAY21_BADGE_NAME,
    };
  }

  // #108: Passive proof API integrations
  getPassiveProviders() { return getPassiveProviders(); }
  getPassiveProviderConfig(provider: PassiveProvider) { return getPassiveProviderConfig(provider); }

  // #107: Emotional contagion safeguards
  evaluatePodBroadcast(podId: string, failureCount: number, memberCount: number, lastBroadcastAt: Date | null) {
    return evaluatePodBroadcast({ podId, failureCount, memberCount, lastBroadcastAt });
  }

  // #106: Auditor wellness
  assessAuditorWellness(auditorId: string, consecutiveReviews: number, avgReviewTimeSec: number, recentRejectionRate: number) {
    return assessAuditorWellness({ auditorId, consecutiveReviews, avgReviewTimeSec, recentRejectionRate });
  }

  // #105: Generosity loop
  calculateGenerosityGrant(giverCompletedContracts: number, giverAverageStakeCents: number) {
    return calculateGenerosityGrant(giverCompletedContracts, giverAverageStakeCents);
  }

  // #104: Contract rollover
  generateRolloverOffer(completedContractCategory: string, completedContractStakeCents: number) {
    return generateRolloverOffer({ completedContractCategory, completedContractStakeCents });
  }

  // #103: Academy
  getAcademyProgress(completedIds: string[]) { return getAcademyProgress(completedIds); }

  // #100: Resistance patterns
  detectResistancePatterns(text: string) { return detectResistancePatterns(text); }

  // #93: Intake assessment
  getIntakeAssessment() { return INTAKE_ASSESSMENT; }
  calculateAssessmentProfile(answers: Record<string, number>) { return calculateAssessmentProfile(answers); }

  // #92: DECO oracle stub
  createDecoProof(url: string, selector: string, expectedValue: string) {
    return createDecoProof({ url, selector, expectedValue });
  }

  // #91: Oracle failure fallback
  resolveOracleFailure(verdicts: any[]) { return resolveOracleFailure(verdicts); }

  // #90: Stablecoin quote
  quoteStablecoinStake(usdCents: number, stablecoinType: 'USDC' | 'USDT') {
    return quoteStablecoinStake(usdCents, stablecoinType);
  }

  // #89: Revenue share
  calculateRevenueShare(totalPoolCents: number, totalDataPoints: number, userDataPoints: number) {
    return calculateRevenueShare({ totalPoolCents, totalDataPoints, userDataPoints });
  }

  // #88: Whistleblower
  createWhistleblowerReport(category: 'FRAUD' | 'ABUSE' | 'COLLUSION' | 'OTHER') {
    return createWhistleblowerReport(category);
  }
}
