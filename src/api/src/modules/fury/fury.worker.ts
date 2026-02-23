import { Injectable, Inject, OnModuleInit, Logger, forwardRef, Optional } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { Pool } from 'pg';
import { FURY_ROUTER_QUEUE_NAME, REDIS_CONNECTION_CONFIG } from '../../../config/queue.config';
import { ConsensusEngine, FuryVote } from './consensus.engine';
import { ContractsService } from '../contracts/contracts.service';
import { NotificationsService } from '../notifications/notifications.service';

interface FuryRouteJob {
  proofId: string;
  submitterUserId: string;
  requiredReviewers: number;
  dispatchedAt: string;
}

@Injectable()
export class FuryWorker implements OnModuleInit {
  private readonly logger = new Logger(FuryWorker.name);
  private worker: Worker;

  constructor(
    private readonly pool: Pool,
    private readonly consensusEngine: ConsensusEngine,
    @Inject(forwardRef(() => ContractsService))
    private readonly contractsService: ContractsService,
    @Optional() @Inject(NotificationsService) private readonly notifications?: NotificationsService,
  ) {}

  onModuleInit() {
    this.worker = new Worker<FuryRouteJob>(
      FURY_ROUTER_QUEUE_NAME,
      async (job: Job<FuryRouteJob>) => this.process(job),
      {
        connection: REDIS_CONNECTION_CONFIG,
        concurrency: 5,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Fury job ${job?.id} failed: ${err.message}`);
    });

    this.logger.log('Fury worker started, listening on FURY_ROUTER_QUEUE');
  }

  private async process(job: Job<FuryRouteJob>): Promise<void> {
    const { proofId, submitterUserId, requiredReviewers } = job.data;

    // 1. Find eligible Furies: active users who are not the submitter
    const eligibleResult = await this.pool.query(
      `SELECT id FROM users
       WHERE status = 'ACTIVE' AND id != $1
       ORDER BY RANDOM()
       LIMIT $2`,
      [submitterUserId, requiredReviewers],
    );

    if (eligibleResult.rows.length === 0) {
      this.logger.warn(`No eligible Furies found for proof ${proofId}`);
      return;
    }

    // 2. Create fury_assignments
    for (const row of eligibleResult.rows) {
      await this.pool.query(
        `INSERT INTO fury_assignments (proof_id, fury_user_id) VALUES ($1, $2)`,
        [proofId, row.id],
      );
    }

    // 3. Update proof status
    await this.pool.query(
      `UPDATE proofs SET status = 'IN_REVIEW' WHERE id = $1`,
      [proofId],
    );

    this.logger.log(
      `Assigned ${eligibleResult.rows.length} Furies to proof ${proofId}`,
    );
  }

  /**
   * Called externally when all verdicts for a proof are in.
   * Checks if consensus threshold is met and triggers resolution.
   */
  async checkConsensus(proofId: string): Promise<void> {
    // Get all assignments for this proof
    const assignments = await this.pool.query(
      `SELECT fury_user_id, verdict FROM fury_assignments WHERE proof_id = $1`,
      [proofId],
    );

    const allVoted = assignments.rows.every((r) => r.verdict !== null);
    if (!allVoted) return; // not all reviewers have voted yet

    // Check if proof is honeypot
    const proofResult = await this.pool.query(
      `SELECT is_honeypot, contract_id FROM proofs WHERE id = $1`,
      [proofId],
    );
    if (proofResult.rows.length === 0) return;

    const { is_honeypot, contract_id } = proofResult.rows[0];

    const votes: FuryVote[] = assignments.rows.map((r) => ({
      furyUserId: r.fury_user_id,
      verdict: r.verdict,
    }));

    const result = await this.consensusEngine.evaluate(proofId, votes, is_honeypot);

    // Update proof status based on consensus
    const proofStatus =
      result.outcome === 'VERIFIED'
        ? 'VERIFIED'
        : result.outcome === 'REJECTED'
          ? 'REJECTED'
          : 'SPLIT';

    await this.pool.query(
      `UPDATE proofs SET status = $1 WHERE id = $2`,
      [proofStatus, proofId],
    );

    // Apply fraud penalty to flagged Furies (honeypot failures)
    for (const furyId of result.flaggedFuries) {
      await this.pool.query(
        `UPDATE users SET integrity_score = GREATEST(0, integrity_score - 15) WHERE id = $1`,
        [furyId],
      );
    }

    // Track Fury accuracy: reward correct votes, penalize incorrect ones
    if (!is_honeypot && result.outcome !== 'SPLIT') {
      for (const vote of votes) {
        const wasCorrect =
          (result.outcome === 'VERIFIED' && vote.verdict === 'PASS') ||
          (result.outcome === 'REJECTED' && vote.verdict === 'FAIL');

        if (wasCorrect) {
          await this.pool.query(
            `UPDATE users SET integrity_score = integrity_score + 2 WHERE id = $1`,
            [vote.furyUserId],
          );
        } else {
          await this.pool.query(
            `UPDATE users SET integrity_score = GREATEST(0, integrity_score - 5) WHERE id = $1`,
            [vote.furyUserId],
          );
        }
      }
    }

    // Notify proof submitter of consensus result
    if (contract_id) {
      const contractResult = await this.pool.query(
        `SELECT user_id FROM contracts WHERE id = $1`,
        [contract_id],
      );
      if (contractResult.rows.length > 0) {
        await this.notifications?.create({
          userId: contractResult.rows[0].user_id,
          type: 'CONSENSUS_REACHED',
          title: `Proof ${result.outcome === 'VERIFIED' ? 'Verified' : result.outcome === 'REJECTED' ? 'Rejected' : 'Split'}`,
          body: result.outcome === 'VERIFIED'
            ? 'Your proof has been verified by the Fury network.'
            : result.outcome === 'REJECTED'
              ? 'Your proof has been rejected by the Fury network.'
              : 'The Fury network reached a split decision on your proof.',
          metadata: { proofId, contractId: contract_id, outcome: result.outcome },
        });
      }
    }

    // Bridge: resolve the contract based on consensus outcome
    if (contract_id && result.outcome !== 'SPLIT') {
      try {
        const resolution = result.outcome === 'VERIFIED' ? 'COMPLETED' : 'FAILED';
        await this.contractsService.resolveContract(contract_id, resolution);
        this.logger.log(
          `Contract ${contract_id} resolved as ${resolution} via consensus`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to resolve contract ${contract_id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    this.logger.log(
      `Consensus for proof ${proofId}: ${result.outcome} (${result.flaggedFuries.length} flagged)`,
    );
  }
}
