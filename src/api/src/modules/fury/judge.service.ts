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

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Log the judicial decision
      await this.truthLog.appendEvent('JUDICIAL_OVERRIDE', {
        ...res,
        timestamp: new Date().toISOString(),
      });

      // 2. Resolve the contract via standard service
      // This will trigger the SettlementService flow (including refund-only checks)
      await this.contractsService.resolveContract(
        res.contractId!,
        res.verdict === 'PASS' ? 'COMPLETED' : 'FAILED'
      );

      // 3. Mark dispute as resolved if applicable
      if (res.disputeId) {
        await client.query(
          `UPDATE disputes SET status = 'RESOLVED', resolution = $1, resolved_at = NOW(), judge_id = $2 WHERE id = $3`,
          [res.verdict, res.judgeId, res.disputeId]
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      this.logger.error(`Judicial resolution failed: ${e instanceof Error ? e.message : e}`);
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * List all items requiring judicial intervention.
   */
  async getPendingQueue() {
    const splitProofs = await this.pool.query(
      `SELECT p.id as proof_id, p.contract_id, p.user_id, c.oath_category, c.stake_amount 
       FROM proofs p
       JOIN contracts c ON p.contract_id = c.id
       WHERE p.status = 'UNDER_REVIEW' 
       AND (SELECT COUNT(*) FROM fury_assignments WHERE proof_id = p.id AND verdict IS NOT NULL) >= 3
       -- Logic for "SPLIT" could be more complex in SQL, but this finds potentially stuck items
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
