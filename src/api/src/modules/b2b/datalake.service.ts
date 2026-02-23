import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { AnonymizeService } from './anonymize.service';

/**
 * Data Lake extraction service for B2B analytics.
 * Exports anonymized behavioral data from the operational database
 * for enterprise HR consumers. Uses logical replication slots
 * for CDC (Change Data Capture) in production; batch extraction
 * as the initial implementation.
 */

export interface DataLakeSnapshot {
  extractedAt: string;
  enterpriseId: string;
  period: { start: string; end: string };
  contractMetrics: ContractMetric[];
  behavioralTrends: BehavioralTrend[];
  cohortAnalysis: CohortBucket[];
}

export interface ContractMetric {
  oathCategory: string;
  totalCreated: number;
  totalCompleted: number;
  totalFailed: number;
  avgStakeAmount: number;
  avgDurationDays: number;
  completionRate: number;
}

export interface BehavioralTrend {
  month: string;
  newContracts: number;
  completions: number;
  failures: number;
  avgIntegrityDelta: number;
}

export interface CohortBucket {
  cohortMonth: string;
  employeeCount: number;
  avgIntegrityScore: number;
  avgCompletionRate: number;
  retentionRate: number;
}

@Injectable()
export class DataLakeService {
  private readonly logger = new Logger(DataLakeService.name);

  constructor(
    private readonly pool: Pool,
    private readonly anonymize: AnonymizeService,
  ) {}

  /**
   * Extract a full analytics snapshot for an enterprise.
   * All data is pre-anonymized — no PII leaves this service.
   */
  async extractSnapshot(
    enterpriseId: string,
    startDate: string,
    endDate: string,
  ): Promise<DataLakeSnapshot> {
    const [contractMetrics, behavioralTrends, cohortAnalysis] = await Promise.all([
      this.extractContractMetrics(enterpriseId, startDate, endDate),
      this.extractBehavioralTrends(enterpriseId, startDate, endDate),
      this.extractCohortAnalysis(enterpriseId),
    ]);

    return {
      extractedAt: new Date().toISOString(),
      enterpriseId,
      period: { start: startDate, end: endDate },
      contractMetrics,
      behavioralTrends,
      cohortAnalysis,
    };
  }

  /**
   * Contract metrics by oath category for the given period.
   */
  private async extractContractMetrics(
    enterpriseId: string,
    startDate: string,
    endDate: string,
  ): Promise<ContractMetric[]> {
    const result = await this.pool.query(
      `SELECT
         c.oath_category,
         COUNT(*) as total_created,
         COUNT(*) FILTER (WHERE c.status = 'COMPLETED') as total_completed,
         COUNT(*) FILTER (WHERE c.status = 'FAILED') as total_failed,
         AVG(c.stake_amount) as avg_stake,
         AVG(c.duration_days) as avg_duration
       FROM contracts c
       JOIN users u ON c.user_id = u.id
       WHERE u.enterprise_id = $1
         AND c.created_at >= $2
         AND c.created_at < $3
       GROUP BY c.oath_category
       ORDER BY total_created DESC`,
      [enterpriseId, startDate, endDate],
    );

    return result.rows.map((row) => {
      const total = Number(row.total_created);
      const completed = Number(row.total_completed);
      return {
        oathCategory: row.oath_category,
        totalCreated: total,
        totalCompleted: completed,
        totalFailed: Number(row.total_failed),
        avgStakeAmount: Math.round(Number(row.avg_stake) * 100) / 100,
        avgDurationDays: Math.round(Number(row.avg_duration)),
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }

  /**
   * Monthly behavioral trends (new contracts, completions, failures, integrity delta).
   */
  private async extractBehavioralTrends(
    enterpriseId: string,
    startDate: string,
    endDate: string,
  ): Promise<BehavioralTrend[]> {
    const result = await this.pool.query(
      `SELECT
         TO_CHAR(c.created_at, 'YYYY-MM') as month,
         COUNT(*) as new_contracts,
         COUNT(*) FILTER (WHERE c.status = 'COMPLETED') as completions,
         COUNT(*) FILTER (WHERE c.status = 'FAILED') as failures
       FROM contracts c
       JOIN users u ON c.user_id = u.id
       WHERE u.enterprise_id = $1
         AND c.created_at >= $2
         AND c.created_at < $3
       GROUP BY TO_CHAR(c.created_at, 'YYYY-MM')
       ORDER BY month`,
      [enterpriseId, startDate, endDate],
    );

    return result.rows.map((row) => ({
      month: row.month,
      newContracts: Number(row.new_contracts),
      completions: Number(row.completions),
      failures: Number(row.failures),
      avgIntegrityDelta: 0, // Requires event_log cross-reference; placeholder
    }));
  }

  /**
   * Employee cohort analysis by join month.
   */
  private async extractCohortAnalysis(enterpriseId: string): Promise<CohortBucket[]> {
    const result = await this.pool.query(
      `WITH user_cohorts AS (
         SELECT
           u.id,
           TO_CHAR(u.created_at, 'YYYY-MM') as cohort_month,
           u.integrity_score,
           u.status
         FROM users u
         WHERE u.enterprise_id = $1
       ),
       cohort_contracts AS (
         SELECT
           uc.cohort_month,
           COUNT(DISTINCT uc.id) as employee_count,
           AVG(uc.integrity_score) as avg_integrity,
           COUNT(DISTINCT uc.id) FILTER (WHERE uc.status = 'ACTIVE') as active_count,
           COUNT(c.id) FILTER (WHERE c.status = 'COMPLETED') as completed,
           COUNT(c.id) as total_contracts
         FROM user_cohorts uc
         LEFT JOIN contracts c ON c.user_id = uc.id
         GROUP BY uc.cohort_month
       )
       SELECT
         cohort_month,
         employee_count,
         ROUND(avg_integrity) as avg_integrity_score,
         CASE WHEN total_contracts > 0
           THEN ROUND((completed::numeric / total_contracts) * 100)
           ELSE 0
         END as avg_completion_rate,
         CASE WHEN employee_count > 0
           THEN ROUND((active_count::numeric / employee_count) * 100)
           ELSE 0
         END as retention_rate
       FROM cohort_contracts
       ORDER BY cohort_month`,
      [enterpriseId],
    );

    return result.rows.map((row) => ({
      cohortMonth: row.cohort_month,
      employeeCount: Number(row.employee_count),
      avgIntegrityScore: Number(row.avg_integrity_score),
      avgCompletionRate: Number(row.avg_completion_rate),
      retentionRate: Number(row.retention_rate),
    }));
  }

  /**
   * Set up PostgreSQL logical replication for real-time CDC.
   * Called once during initial production provisioning.
   */
  async setupReplicationSlot(slotName: string = 'styx_datalake'): Promise<{ created: boolean }> {
    try {
      await this.pool.query(
        `SELECT pg_create_logical_replication_slot($1, 'pgoutput')`,
        [slotName],
      );
      this.logger.log(`Created replication slot: ${slotName}`);
      return { created: true };
    } catch (error: any) {
      if (error.code === '42710') {
        // Slot already exists
        this.logger.log(`Replication slot already exists: ${slotName}`);
        return { created: false };
      }
      throw error;
    }
  }

  /**
   * Create a publication for the tables needed by the data lake.
   * Only behavioral data tables — no PII-bearing columns are replicated.
   */
  async setupPublication(pubName: string = 'styx_analytics'): Promise<void> {
    await this.pool.query(`
      CREATE PUBLICATION ${pubName} FOR TABLE
        contracts (id, oath_category, verification_method, stake_amount, duration_days, status, strikes, grace_days_used, started_at, ends_at, created_at),
        entries (id, debit_account_id, credit_account_id, amount, contract_id, created_at),
        fury_assignments (id, proof_id, fury_user_id, verdict, reviewed_at, assigned_at),
        event_log (id, event_type, current_hash, created_at)
    `);
    this.logger.log(`Created publication: ${pubName}`);
  }
}
