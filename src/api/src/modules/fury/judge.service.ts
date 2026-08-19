import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { ContractsService } from '../contracts/contracts.service';

export interface DisputeResolution {
  disputeId?: string;
  contractId?: string;
  proofId?: string;
  verdict: 'PASS' | 'FAIL';
  reason: string;
  judgeId: string;
}

@Injectable()
export class JudgeService {
  private readonly logger = new Logger(JudgeService.name);

  constructor(
    private readonly pool: Pool,
    private readonly truthLog: TruthLogService,
    private readonly contractsService: ContractsService,
  ) {}

  /**
   * F-CORE-09: Judge Panel & Dispute Resolution
   * Provides manual override for split Fury decisions or escalated disputes.
   */
  async resolveDispute(res: DisputeResolution): Promise<void> {
    this.logger.log(`Judge ${res.judgeId} resolving dispute for contract ${res.contractId} as ${res.verdict}`);

    // The TruthLog append and contract resolution run on their own connections and
    // CANNOT be rolled back by this method's local transaction. To avoid leaving an
    // override logged / a contract resolved when the local write fails, commit the
    // local dispute-status change FIRST, then perform the external side-effects.
    if (res.disputeId) {
      // `disputes` (004_disputes) carries its lifecycle in `appeal_status`, the adjudicator in
      // `judge_user_id` and the written rationale in `judge_notes` — there is no status/
      // resolution/judge_id column. A dispute row only exists because an appeal was filed
      // against a rejection, so a PASS verdict overturns that rejection and a FAIL upholds it,
      // matching the vocabulary DisputeService and the admin queue already read.
      const appealStatus = res.verdict === 'PASS' ? 'RESOLVED_OVERTURNED' : 'RESOLVED_UPHELD';
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE disputes SET appeal_status = $1, judge_notes = $2, resolved_at = NOW(), judge_user_id = $3 WHERE id = $4`,
          [appealStatus, res.reason, res.judgeId, res.disputeId]
        );
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        this.logger.error(`Judicial resolution failed: ${e instanceof Error ? e.message : e}`);
        throw e;
      } finally {
        client.release();
      }
    }

    // External side-effects — only reached once the local dispute update has committed.
    // 1. Log the judicial decision.
    await this.truthLog.appendEvent('JUDICIAL_OVERRIDE', {
      ...res,
      timestamp: new Date().toISOString(),
    });

    // 2. Resolve the contract via the standard service (triggers SettlementService flow).
    await this.contractsService.resolveContract(
      res.contractId!,
      res.verdict === 'PASS' ? 'COMPLETED' : 'FAILED'
    );
  }

  /**
   * List all items requiring judicial intervention.
   */
  async getPendingQueue() {
    const splitProofs = await this.pool.query(
      `SELECT p.id as proof_id, p.contract_id, p.user_id, c.oath_category, c.stake_amount
       FROM proofs p
       JOIN contracts c ON p.contract_id = c.id
       WHERE (
         -- Proofs the consensus engine explicitly marked as a split decision.
         p.status = 'SPLIT'
         -- Or fully-voted proofs still stuck in review (potential split / stranded).
         OR (
           p.status IN ('UNDER_REVIEW', 'IN_REVIEW')
           AND (SELECT COUNT(*) FROM fury_assignments WHERE proof_id = p.id AND verdict IS NOT NULL) >= 3
         )
       )
      `
    );

    // A dispute points at a proof, not a contract — the contract is reached through
    // proofs.contract_id. `contract_id` is projected explicitly because callers feed it
    // straight back into resolveDispute().
    const activeDisputes = await this.pool.query(
      `SELECT d.*, p.contract_id, c.user_id, c.oath_category
       FROM disputes d
       JOIN proofs p ON d.proof_id = p.id
       JOIN contracts c ON p.contract_id = c.id
       WHERE d.appeal_status IN ('FEE_AUTHORIZED_PENDING_REVIEW', 'PENDING_REVIEW', 'IN_REVIEW')`
    );

    return {
      splitProofs: splitProofs.rows,
      disputes: activeDisputes.rows,
    };
  }
}
