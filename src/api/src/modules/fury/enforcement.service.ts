import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

@Injectable()
export class EnforcementService {
  private readonly logger = new Logger(EnforcementService.name);

  constructor(
    private readonly pool: Pool,
    private readonly truthLog: TruthLogService,
  ) {}

  async evaluateCollusion(proofId: string, flaggedFuries: string[]): Promise<void> {
    if (!flaggedFuries || flaggedFuries.length === 0) return;

    for (const furyId of flaggedFuries) {
      // Create an enforcement case for failing a honeypot
      const caseResult = await this.pool.query(
        `INSERT INTO fury_enforcement_cases (reviewer_id, case_type, confidence, status, evidence_json)
         VALUES ($1, 'HONEYPOT_FAILURE', 1.0, 'PENDING_REVIEW', $2)
         RETURNING id`,
        [furyId, JSON.stringify({ proofId, reason: 'Passed a known honeypot' })]
      );
      
      const caseId = caseResult.rows[0].id;
      
      // Auto-apply penalty (reputation burn) for 100% confidence honeypot failures
      await this.applyPenalty(caseId, 'REP_BURN', 0);
    }
  }

  async applyPenalty(caseId: string, penaltyType: string, amountCents: number = 0) {
    await this.pool.query(
      `INSERT INTO fury_penalties (case_id, penalty_type, amount_cents) VALUES ($1, $2, $3)`,
      [caseId, penaltyType, amountCents]
    );

    await this.pool.query(
      `UPDATE fury_enforcement_cases SET status = 'PENALTY_APPLIED' WHERE id = $1`,
      [caseId]
    );

    const caseData = await this.pool.query(`SELECT reviewer_id FROM fury_enforcement_cases WHERE id = $1`, [caseId]);

    await this.truthLog.appendEvent('FURY_PENALTY_APPLIED', {
      caseId,
      penaltyType,
      reviewerId: caseData.rows[0].reviewer_id,
    });
  }

  async appealCase(caseId: string, reviewerId: string, reason: string) {
    const caseResult = await this.pool.query(
      `SELECT id FROM fury_enforcement_cases WHERE id = $1 AND reviewer_id = $2`,
      [caseId, reviewerId]
    );

    if (caseResult.rows.length === 0) {
      throw new NotFoundException('Case not found');
    }

    await this.pool.query(
      `UPDATE fury_enforcement_cases SET status = 'APPEALED', evidence_json = evidence_json || jsonb_build_object('appeal_reason', $2::text) WHERE id = $1`,
      [caseId, reason]
    );

    await this.truthLog.appendEvent('FURY_PENALTY_APPEALED', {
      caseId,
      reviewerId,
      reason,
    });

    return { success: true, caseId, status: 'APPEALED' };
  }
}

