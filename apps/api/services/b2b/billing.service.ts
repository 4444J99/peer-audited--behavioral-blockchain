import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

export interface UsageSummary {
  enterpriseId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  usage: Record<string, number>;
}

@Injectable()
export class ConsumptionBillingService {
  private readonly logger = new Logger(ConsumptionBillingService.name);

  constructor(private readonly pool: Pool) {}

  async trackEvent(enterpriseId: string, eventType: string, units: number = 1): Promise<void> {
    this.logger.log(`[BILLING] Enterprise ${enterpriseId}: ${units}x ${eventType}`);
    await this.pool.query(
      `INSERT INTO consumption_logs (enterprise_id, event_type, units, recorded_at) VALUES ($1, $2, $3, NOW())`,
      [enterpriseId, eventType, units],
    );
  }

  async getCurrentUsage(enterpriseId: string): Promise<UsageSummary> {
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const result = await this.pool.query(
      `SELECT event_type, COALESCE(SUM(units), 0)::int AS total
       FROM consumption_logs
       WHERE enterprise_id = $1
         AND recorded_at >= $2
         AND recorded_at < $3
       GROUP BY event_type`,
      [enterpriseId, periodStart.toISOString(), periodEnd.toISOString()],
    );

    const usage: Record<string, number> = {};
    for (const row of result.rows) {
      usage[row.event_type] = row.total;
    }

    return {
      enterpriseId,
      billingPeriodStart: periodStart.toISOString(),
      billingPeriodEnd: periodEnd.toISOString(),
      usage,
    };
  }

  async getUsageHistory(enterpriseId: string, months: number = 6): Promise<UsageSummary[]> {
    const result = await this.pool.query(
      `SELECT event_type,
              COALESCE(SUM(units), 0)::int AS total,
              date_trunc('month', recorded_at) AS period
       FROM consumption_logs
       WHERE enterprise_id = $1
         AND recorded_at >= (NOW() - ($2 || ' months')::interval)
       GROUP BY event_type, date_trunc('month', recorded_at)
       ORDER BY period DESC`,
      [enterpriseId, months],
    );

    const periods = new Map<string, Record<string, number>>();
    for (const row of result.rows) {
      const key = (row.period as Date).toISOString();
      if (!periods.has(key)) periods.set(key, {});
      periods.get(key)![row.event_type] = row.total;
    }

    return Array.from(periods.entries()).map(([periodStart, usage]) => {
      const start = new Date(periodStart);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      return {
        enterpriseId,
        billingPeriodStart: start.toISOString(),
        billingPeriodEnd: end.toISOString(),
        usage,
      };
    });
  }
}
