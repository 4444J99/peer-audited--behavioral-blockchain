import { Injectable, HttpException, HttpStatus, NotFoundException, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { StripeFboService } from './stripe.service';
import { TruthLogService } from '../ledger/truth-log.service';
import { LedgerService } from '../ledger/ledger.service';
import { APPEAL_FEE_AMOUNT } from '../billing';

interface DisputeDetail {
  id: string;
  proofId: string;
  contractId: string;
  userId: string;
  userEmail: string;
  oathCategory: string;
  proofStatus: string;
  mediaUri: string | null;
  submittedAt: string;
  appealStatus: string;
  judgeUserId: string | null;
  judgeNotes: string | null;
  resolvedAt: string | null;
  furyVotes: Array<{ furyUserId: string; verdict: string; reviewedAt: string }>;
}

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    private readonly pool: Pool,
    private readonly stripeService: StripeFboService,
    private readonly truthLog: TruthLogService,
    private readonly ledger: LedgerService,
  ) {}

  /**
   * Initiates an appeal for a rejected audit.
   * Mandates a $5 friction fee to prevent frivolous escalations to the human judge.
   */
  async initiateAppeal(
    userId: string,
    proofId: string,
    customerId: string,
  ): Promise<{ appealStatus: string; paymentIntentId: string }> {
    try {
      // Hold the $5.00 appeal fee
      const holdResult = await this.stripeService.holdStake(customerId, APPEAL_FEE_AMOUNT, proofId);

      // Create dispute record
      await this.pool.query(
        `INSERT INTO disputes (proof_id, user_id, appeal_status, payment_intent_id, created_at)
         VALUES ($1, $2, 'FEE_AUTHORIZED_PENDING_REVIEW', $3, NOW())
         ON CONFLICT (proof_id) DO UPDATE SET
           appeal_status = 'FEE_AUTHORIZED_PENDING_REVIEW',
           payment_intent_id = $3`,
        [proofId, userId, holdResult.id],
      );

      // Update proof status
      await this.pool.query(
        `UPDATE proofs SET status = 'DISPUTED' WHERE id = $1`,
        [proofId],
      );

      await this.truthLog.appendEvent('APPEAL_INITIATED', {
        proofId,
        userId,
        amount: APPEAL_FEE_AMOUNT,
        paymentIntentId: holdResult.id,
      });

      return {
        appealStatus: 'FEE_AUTHORIZED_PENDING_REVIEW',
        paymentIntentId: holdResult.id,
      };
    } catch (error: any) {
      throw new HttpException(
        `Appeal Rejected: Could not authorize the $${APPEAL_FEE_AMOUNT} appeal fee. Reason: ${error.message}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  /**
   * Get the queue of disputes pending judge review.
   * Returns disputes with basic metadata for the admin dashboard.
   */
  async getDisputeQueue(): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT d.id, d.proof_id, d.user_id, d.appeal_status, d.judge_user_id, d.created_at,
              p.media_uri, p.status AS proof_status, p.content_type, p.submitted_at,
              u.email AS user_email,
              c.oath_category, c.id AS contract_id
       FROM disputes d
       JOIN proofs p ON d.proof_id = p.id
       JOIN users u ON d.user_id = u.id
       JOIN contracts c ON p.contract_id = c.id
       WHERE d.appeal_status IN ('FEE_AUTHORIZED_PENDING_REVIEW', 'IN_REVIEW')
       ORDER BY d.created_at ASC`,
    );
    return result.rows;
  }

  /**
   * Get full dispute detail including Fury vote history.
   */
  async getDisputeDetail(disputeId: string): Promise<DisputeDetail> {
    const dispute = await this.pool.query(
      `SELECT d.id, d.proof_id, d.user_id, d.appeal_status, d.judge_user_id,
              d.judge_notes, d.resolved_at,
              p.media_uri, p.status AS proof_status, p.submitted_at, p.content_type,
              u.email AS user_email,
              c.oath_category, c.id AS contract_id
       FROM disputes d
       JOIN proofs p ON d.proof_id = p.id
       JOIN users u ON d.user_id = u.id
       JOIN contracts c ON p.contract_id = c.id
       WHERE d.id = $1`,
      [disputeId],
    );

    if (dispute.rows.length === 0) {
      throw new NotFoundException('Dispute not found');
    }

    const row = dispute.rows[0];

    // Get Fury vote history
    const votes = await this.pool.query(
      `SELECT fury_user_id, verdict, reviewed_at
       FROM fury_assignments
       WHERE proof_id = $1 AND verdict IS NOT NULL
       ORDER BY reviewed_at ASC`,
      [row.proof_id],
    );

    return {
      id: row.id,
      proofId: row.proof_id,
      contractId: row.contract_id,
      userId: row.user_id,
      userEmail: row.user_email,
      oathCategory: row.oath_category,
      proofStatus: row.proof_status,
      mediaUri: row.media_uri,
      submittedAt: row.submitted_at,
      appealStatus: row.appeal_status,
      judgeUserId: row.judge_user_id,
      judgeNotes: row.judge_notes,
      resolvedAt: row.resolved_at,
      furyVotes: votes.rows,
    };
  }

  /**
   * The Judge resolves a dispute. Outcomes:
   *   - UPHELD: Original verdict stands. Appeal fee captured as revenue.
   *   - OVERTURNED: Proof re-verified. Appeal fee refunded. Furies penalized.
   *   - ESCALATED: Requires further investigation. Appeal fee held.
   */
  async resolveDispute(
    disputeId: string,
    judgeUserId: string,
    outcome: 'UPHELD' | 'OVERTURNED' | 'ESCALATED',
    judgeNotes: string,
  ): Promise<{ status: string }> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get dispute details
      const dispute = await client.query(
        `SELECT d.id, d.proof_id, d.user_id, d.payment_intent_id,
                p.contract_id
         FROM disputes d
         JOIN proofs p ON d.proof_id = p.id
         WHERE d.id = $1 AND d.appeal_status IN ('FEE_AUTHORIZED_PENDING_REVIEW', 'IN_REVIEW')`,
        [disputeId],
      );

      if (dispute.rows.length === 0) {
        throw new NotFoundException('Dispute not found or already resolved');
      }

      const { proof_id, user_id, payment_intent_id, contract_id } = dispute.rows[0];

      // Map outcome to final statuses
      let appealStatus: string;
      let proofStatus: string;

      switch (outcome) {
        case 'UPHELD':
          appealStatus = 'RESOLVED_UPHELD';
          proofStatus = 'REJECTED'; // Original rejection stands
          // Capture the appeal fee as revenue
          try {
            await this.stripeService.captureStake(payment_intent_id);
          } catch {
            // Fee capture failure is non-blocking
          }
          break;

        case 'OVERTURNED':
          appealStatus = 'RESOLVED_OVERTURNED';
          proofStatus = 'VERIFIED'; // Override to verified
          // Refund the appeal fee
          try {
            await this.stripeService.cancelHold(payment_intent_id);
          } catch {
            // Refund failure is non-blocking
          }
          // Penalize the Furies who voted incorrectly
          await client.query(
            `UPDATE users
             SET integrity_score = GREATEST(0, integrity_score - 10)
             WHERE id IN (
               SELECT fury_user_id FROM fury_assignments
               WHERE proof_id = $1 AND verdict = 'FAIL'
             )`,
            [proof_id],
          );
          break;

        case 'ESCALATED':
          appealStatus = 'ESCALATED';
          proofStatus = 'DISPUTED'; // Stays disputed
          break;
      }

      // Update dispute record
      await client.query(
        `UPDATE disputes
         SET appeal_status = $1, judge_user_id = $2, judge_notes = $3, resolved_at = NOW()
         WHERE id = $4`,
        [appealStatus, judgeUserId, judgeNotes, disputeId],
      );

      // Update proof status
      await client.query(
        `UPDATE proofs SET status = $1 WHERE id = $2`,
        [proofStatus, proof_id],
      );

      await client.query('COMMIT');

      await this.truthLog.appendEvent('DISPUTE_RESOLVED', {
        disputeId,
        proofId: proof_id,
        userId: user_id,
        judgeUserId,
        outcome,
        judgeNotes,
        contractId: contract_id,
      });

      this.logger.log(`Dispute ${disputeId} resolved: ${outcome} by judge ${judgeUserId}`);

      return { status: appealStatus };
    } catch (err) {
      await client.query('ROLLBACK');
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Dispute resolution failed: ${(err as Error).message}`);
      throw err;
    } finally {
      client.release();
    }
  }
}
