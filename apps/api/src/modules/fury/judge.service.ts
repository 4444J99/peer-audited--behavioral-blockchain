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
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE disputes SET status = 'RESOLVED', resolution = $1, resolved_at = NOW(), judge_id = $2 WHERE id = $3`,
          [res.verdict, res.judgeId, res.disputeId]
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

    const activeDisputes = await this.pool.query(
      `SELECT d.*, c.user_id, c.oath_category 
       FROM disputes d
       JOIN contracts c ON d.contract_id = c.id
       WHERE d.status = 'PENDING'`
    );

    return {
      splitProofs: splitProofs.rows,
      disputes: activeDisputes.rows,
    };
  }
}
