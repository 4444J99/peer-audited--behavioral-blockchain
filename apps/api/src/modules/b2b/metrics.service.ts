import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

export interface EnterpriseMetrics {
  enterpriseId: string;
  totalContracts: number;
  completedContracts: number;
  failedContracts: number;
  activeContracts: number;
  completionRate: number;
  avgIntegrityScore: number;
  totalEmployees: number;
}

@Injectable()
export class MetricsService {
  constructor(private readonly pool: Pool) {}

  async getEnterpriseMetrics(enterpriseId: string): Promise<EnterpriseMetrics> {
    const employeeResult = await this.pool.query(
      `SELECT COUNT(*) as total, AVG(integrity_score) as avg_integrity
       FROM users WHERE enterprise_id = $1 AND status = 'ACTIVE'`,
      [enterpriseId],
    );

    const contractResult = await this.pool.query(
      `SELECT
         COUNT(*) as total_contracts,
         COUNT(*) FILTER (WHERE c.status = 'COMPLETED') as completed,
         COUNT(*) FILTER (WHERE c.status = 'FAILED') as failed,
         COUNT(*) FILTER (WHERE c.status = 'ACTIVE') as active
       FROM contracts c
       JOIN users u ON c.user_id = u.id
       WHERE u.enterprise_id = $1`,
      [enterpriseId],
    );

    const stats = contractResult.rows[0];
    const empStats = employeeResult.rows[0];
    const total = Number(stats.total_contracts);
    const completed = Number(stats.completed);

    return {
      enterpriseId,
      totalContracts: total,
      completedContracts: completed,
      failedContracts: Number(stats.failed),
      activeContracts: Number(stats.active),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgIntegrityScore: Math.round(Number(empStats.avg_integrity) || 0),
      totalEmployees: Number(empStats.total),
    };
  }
}
