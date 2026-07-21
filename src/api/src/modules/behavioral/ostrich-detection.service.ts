import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

const INACTIVITY_DAYS_WARNING = 3;
const INACTIVITY_DAYS_CRITICAL = 7;
const CONSECUTIVE_MISSED_PROOF_THRESHOLD = 3;

interface AtRiskUser {
  userId: string;
  activeContracts: number;
  daysSinceLastActive: number;
  consecutiveMissedProofs: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

@Injectable()
export class OstrichDetectionService {
  private readonly logger = new Logger(OstrichDetectionService.name);

  constructor(private readonly pool: Pool) {}

  /**
   * F-AEGIS-09: Detect users showing avoidance patterns.
   * Returns users with active contracts who haven't engaged recently.
   */
  async detectAtRiskUsers(): Promise<AtRiskUser[]> {
    const result = await this.pool.query(
      `SELECT
         u.id AS user_id,
         COUNT(DISTINCT c.id)::int AS active_contracts,
         COALESCE(EXTRACT(DAY FROM NOW() - u.last_active_at)::int, 999) AS days_since_last_active,
         COALESCE(u.consecutive_missed_proofs, 0)::int AS consecutive_missed_proofs
       FROM users u
       JOIN contracts c ON c.user_id = u.id AND c.status = 'ACTIVE'
       WHERE u.status = 'ACTIVE'
       GROUP BY u.id
       HAVING
         COALESCE(EXTRACT(DAY FROM NOW() - u.last_active_at)::int, 999) >= $1
         OR COALESCE(u.consecutive_missed_proofs, 0) >= $2
       ORDER BY days_since_last_active DESC`,
      [INACTIVITY_DAYS_WARNING, CONSECUTIVE_MISSED_PROOF_THRESHOLD],
    );

    return result.rows.map((row) => {
      const daysSince = row.days_since_last_active;
      const missedProofs = row.consecutive_missed_proofs;

      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      if (daysSince >= INACTIVITY_DAYS_CRITICAL || missedProofs >= CONSECUTIVE_MISSED_PROOF_THRESHOLD * 2) {
        riskLevel = 'HIGH';
      } else if (daysSince >= INACTIVITY_DAYS_WARNING || missedProofs >= CONSECUTIVE_MISSED_PROOF_THRESHOLD) {
        riskLevel = 'MEDIUM';
      } else {
        riskLevel = 'LOW';
      }

      return {
        userId: row.user_id,
        activeContracts: row.active_contracts,
        daysSinceLastActive: daysSince,
        consecutiveMissedProofs: missedProofs,
        riskLevel,
      };
    });
  }

  /**
   * Records a missed proof for a user, incrementing their consecutive missed count.
   */
  async recordMissedProof(userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE users
       SET consecutive_missed_proofs = consecutive_missed_proofs + 1
       WHERE id = $1`,
      [userId],
    );
  }

  /**
   * Resets the consecutive missed proof counter (user completed a proof or re-engaged).
   */
  async resetMissedProofs(userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE users
       SET consecutive_missed_proofs = 0
       WHERE id = $1 AND consecutive_missed_proofs > 0`,
      [userId],
    );
  }
}
