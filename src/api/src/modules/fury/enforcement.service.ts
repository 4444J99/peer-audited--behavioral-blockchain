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
      // Open an enforcement case for failing a honeypot. A single honeypot miss is
      // suggestive, not conclusive — the case stays PENDING_REVIEW and the penalty
      // (REP_BURN) is only applied after a reviewer confirms it via confirmCase().
      const caseResult = await this.pool.query(
        `INSERT INTO fury_enforcement_cases (reviewer_id, case_type, confidence, status, evidence_json)
         VALUES ($1, 'HONEYPOT_FAILURE', 0.5, 'PENDING_REVIEW', $2)
         RETURNING id`,
        [furyId, JSON.stringify({ proofId, reason: 'Verdict disagreed with honeypot expected result' })]
      );

      const caseId = caseResult.rows[0].id;

      await this.truthLog.appendEvent('FURY_ENFORCEMENT_CASE_OPENED', {
        caseId,
        reviewerId: furyId,
        proofId,
        caseType: 'HONEYPOT_FAILURE',
      });
    }
  }

  /**
   * Confirms a pending enforcement case after review and applies the penalty.
   * Penalties are never auto-applied before this confirmation step.
   */
  async confirmCase(caseId: string, penaltyType: string = 'REP_BURN', amountCents: number = 0) {
    // Atomically claim the case (TOCTOU-safe): only the caller that flips
    // PENDING_REVIEW -> PENALTY_APPLIED proceeds, so two concurrent confirmations
    // can't both apply a penalty. The loser matches zero rows and is rejected.
    const claim = await this.pool.query(
      `UPDATE fury_enforcement_cases SET status = 'PENALTY_APPLIED'
       WHERE id = $1 AND status = 'PENDING_REVIEW'
       RETURNING id`,
      [caseId]
    );

    if (claim.rows.length === 0) {
      throw new NotFoundException('Pending case not found');
    }

    await this.applyPenalty(caseId, penaltyType, amountCents);
    return { success: true, caseId, status: 'PENALTY_APPLIED' };
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

