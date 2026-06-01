import { Injectable, Logger } from "@nestjs/common";
import { Pool } from "pg";
import {
  CrabBucketSignal,
  CrabBucketSeverity,
  CrabBucketPattern,
  classifyCrabBucketRisk,
  CommitmentDevice,
  CommitmentDeviceCategory,
  DEFAULT_COMMITMENT_DEVICE_CATALOG,
  calculateStakeWithDevice,
  IdentityDomain,
  IDENTITY_REFRAMING_TABLE,
  getIdentityDomainFromOath,
  reframeMessage,
  EscalationSchedule,
  createDefaultEscalationSchedule,
  calculateNextStake,
  ProfessionalModeConfig,
  ProfessionalModeLevel,
  PROFESSIONAL_MODE_DEFAULTS,
  applyProfessionalModeCopy,
  HabituationMetrics,
  HabituationStatus,
  detectHabituation,
  BehaviorSwapContract,
  BehaviorSwapStatus,
  validateSwapEligibility,
  calculateSwapStake,
} from "@styx/shared/libs/behavioral-enhancements";
import { OathCategory } from "@styx/shared/libs/behavioral-logic";

@Injectable()
export class BehavioralEnhancementsService {
  private readonly logger = new Logger(BehavioralEnhancementsService.name);

  constructor(private readonly pool: Pool) {}

  async analyzeCrabBucketRisk(userId: string): Promise<CrabBucketSignal> {
    const { rows } = await this.pool.query(
      `SELECT pattern, COUNT(*) as count
       FROM crab_bucket_signals
       WHERE user_id = $1
       GROUP BY pattern`,
      [userId],
    );

    const signalCount = rows.reduce(
      (sum: number, r: any) => sum + parseInt(r.count, 10),
      0,
    );
    const patterns = rows.map((r: any) => r.pattern as CrabBucketPattern);

    return {
      userId,
      severity: classifyCrabBucketRisk(signalCount),
      signalCount,
      patterns,
      triggeredAt: new Date(),
    };
  }

  getCommitmentDeviceCatalog(): CommitmentDevice[] {
    return DEFAULT_COMMITMENT_DEVICE_CATALOG.map((d) => ({
      ...d,
      activeSubscribers: 0,
    }));
  }

  async subscribeToDevice(
    userId: string,
    deviceId: string,
  ): Promise<{ subscribed: boolean }> {
    this.logger.log(
      `User ${userId} subscribed to commitment device ${deviceId}`,
    );
    return { subscribed: true };
  }

  async calculateAmplifiedStake(
    baseStake: number,
    deviceIds: string[],
  ): Promise<number> {
    const catalog = this.getCommitmentDeviceCatalog();
    const selected = catalog.filter((d) => deviceIds.includes(d.id));
    return calculateStakeWithDevice(baseStake, selected);
  }

  getReframingForContract(
    oathCategory: string,
    streak: number,
    messageType: "failure" | "streak" | "daily" | "grace",
  ): string {
    const domain = getIdentityDomainFromOath(oathCategory as OathCategory);
    const template = IDENTITY_REFRAMING_TABLE[domain];
    return reframeMessage(template, messageType, streak);
  }

  async getEscalationSchedule(
    contractId: string,
  ): Promise<EscalationSchedule | null> {
    const { rows } = await this.pool.query(
      `SELECT metadata->'escalation' as escalation FROM contracts WHERE id = $1`,
      [contractId],
    );
    if (!rows[0]?.escalation) return null;
    return rows[0].escalation as EscalationSchedule;
  }

  async enableSaveMoreTomorrow(
    contractId: string,
    baseStake: number,
    config?: Partial<EscalationSchedule>,
  ): Promise<EscalationSchedule> {
    const schedule = {
      ...createDefaultEscalationSchedule(baseStake),
      enabled: true,
      ...config,
    };
    await this.pool.query(
      `UPDATE contracts SET metadata = jsonb_set(metadata, '{escalation}', $1::jsonb) WHERE id = $2`,
      [JSON.stringify(schedule), contractId],
    );
    return schedule;
  }

  getProfessionalModeConfig(): ProfessionalModeConfig {
    return { ...PROFESSIONAL_MODE_DEFAULTS };
  }

  applyProfessionalCopy(text: string, config: ProfessionalModeConfig): string {
    return applyProfessionalModeCopy(text, config);
  }

  async detectContractHabituation(
    contractId: string,
  ): Promise<HabituationMetrics> {
    const {
      rows: [contract],
    } = await this.pool.query(
      `SELECT EXTRACT(DAY FROM NOW() - started_at)::int AS age_days
       FROM contracts WHERE id = $1 AND status = 'ACTIVE'`,
      [contractId],
    );

    if (!contract) {
      return {
        contractAgeDays: 0,
        weeklyAttestationRate: [],
        streakVariance: 0,
        timeOfDayVariance: 0,
        status: HabituationStatus.NORMAL,
        suggestedDisruption: null,
      };
    }

    const { rows: attestations } = await this.pool.query(
      `SELECT attestation_date, status, EXTRACT(HOUR FROM attested_at) as hour
       FROM attestations
       WHERE contract_id = $1 AND status IN ('ATTESTED', 'COSIGNED')
       ORDER BY attestation_date DESC
       LIMIT 28`,
      [contractId],
    );

    const weeklyRates = [0, 0, 0, 0];
    const hours: number[] = [];
    const now = new Date();
    for (const a of attestations) {
      const daysAgo = Math.floor(
        (now.getTime() - new Date(a.attestation_date).getTime()) / 86400000,
      );
      const weekIdx = Math.min(Math.floor(daysAgo / 7), 3);
      weeklyRates[3 - weekIdx]++;
      if (a.hour != null) hours.push(Number(a.hour));
    }
    const rates = weeklyRates.map((r) => Math.min(r / 7, 1));

    const rateMean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const streakVariance =
      rates.reduce((sum, r) => sum + (r - rateMean) ** 2, 0) / rates.length;

    const hourMean =
      hours.length > 0 ? hours.reduce((a, b) => a + b, 0) / hours.length : 0;
    const timeOfDayVariance =
      hours.length > 1
        ? hours.reduce((sum, h) => sum + (h - hourMean) ** 2, 0) / hours.length
        : 0;

    const metrics = detectHabituation(contract.age_days, rates, streakVariance);
    metrics.timeOfDayVariance = timeOfDayVariance;
    return metrics;
  }

  async proposeBehaviorSwap(
    userId: string,
    sourceContractId: string,
    targetOathCategory: string,
    carryOverPct: number,
  ): Promise<BehaviorSwapContract> {
    const {
      rows: [contract],
    } = await this.pool.query(
      `SELECT EXTRACT(DAY FROM NOW() - started_at)::int AS age_days, status, stake_amount
       FROM contracts WHERE id = $1 AND user_id = $2`,
      [sourceContractId, userId],
    );

    const eligibility = validateSwapEligibility(
      contract?.age_days ?? 0,
      contract?.status ?? "UNKNOWN",
      0,
    );
    if (!eligibility.eligible) throw new Error(eligibility.reason);

    const newStake = calculateSwapStake(
      parseFloat(contract.stake_amount),
      carryOverPct,
    );

    const {
      rows: [swap],
    } = await this.pool.query(
      `INSERT INTO behavior_swaps (source_contract_id, target_oath_category, carry_over_stake_pct, status, created_at)
       VALUES ($1, $2, $3, 'PROPOSED', NOW()) RETURNING *`,
      [sourceContractId, targetOathCategory, carryOverPct],
    );

    return {
      id: swap.id,
      sourceContractId: swap.source_contract_id,
      targetOathCategory: targetOathCategory as OathCategory,
      swapReason: "",
      carryOverStakePct: swap.carry_over_stake_pct,
      status: BehaviorSwapStatus.PROPOSED,
      createdAt: swap.created_at,
    };
  }
}
