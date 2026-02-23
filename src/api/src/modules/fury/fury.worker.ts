import { Injectable, Inject, OnModuleInit, Logger, forwardRef, Optional } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { Pool } from 'pg';
import { FURY_ROUTER_QUEUE_NAME, REDIS_CONNECTION_CONFIG } from '../../../config/queue.config';
import { ConsensusEngine, FuryVote } from './consensus.engine';
import { ContractsService } from '../contracts/contracts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { shouldDemoteFury, AUDITOR_STAKE_AMOUNT } from '../../../../shared/libs/integrity';

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
    @Optional() @Inject(LedgerService) private readonly ledger?: LedgerService,
    @Optional() @Inject(TruthLogService) private readonly truthLog?: TruthLogService,
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

    // 1. Find eligible Furies: active FURY-role users who are not the submitter
    const eligibleResult = await this.pool.query(
      `SELECT id FROM users
       WHERE status = 'ACTIVE' AND role = 'FURY' AND id != $1
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

    // Disburse Fury bounties/penalties via the double-entry ledger
    if (this.ledger && result.outcome !== 'SPLIT') {
      await this.disburseFuryBounties(votes, result, is_honeypot, contract_id, proofId);
    }

    // Check if any Fury should be demoted based on accuracy
    if (!is_honeypot) {
      for (const vote of votes) {
        const furyStats = await this.pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE fa.verdict IS NOT NULL) as total_audits,
             COUNT(*) FILTER (WHERE (fa.verdict = 'PASS' AND p.status = 'VERIFIED') OR (fa.verdict = 'FAIL' AND p.status = 'REJECTED')) as successful_audits,
             COUNT(*) FILTER (WHERE fa.verdict = 'FAIL' AND p.status = 'VERIFIED') as false_accusations
           FROM fury_assignments fa
           JOIN proofs p ON fa.proof_id = p.id
           WHERE fa.fury_user_id = $1`,
          [vote.furyUserId],
        );
        const stats = furyStats.rows[0];
        if (shouldDemoteFury({
          furyId: vote.furyUserId,
          successfulAudits: Number(stats.successful_audits),
          falseAccusations: Number(stats.false_accusations),
          totalAudits: Number(stats.total_audits),
        })) {
          await this.pool.query(
            `UPDATE users SET role = 'USER' WHERE id = $1 AND role = 'FURY'`,
            [vote.furyUserId],
          );
          this.logger.warn(`Fury ${vote.furyUserId} demoted due to low accuracy`);
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

  /**
   * Disburses AUDITOR_STAKE_AMOUNT bounties to correct Furies and charges penalties to incorrect ones.
   * Honeypot failures also receive a financial penalty via the ledger.
   */
  private async disburseFuryBounties(
    votes: FuryVote[],
    result: { outcome: string; flaggedFuries: string[] },
    isHoneypot: boolean,
    contractId: string | null,
    proofId: string,
  ): Promise<void> {
    // Look up system accounts
    const escrowResult = await this.pool.query(
      `SELECT id FROM accounts WHERE name = 'SYSTEM_ESCROW' LIMIT 1`,
    );
    const revenueResult = await this.pool.query(
      `SELECT id FROM accounts WHERE name = 'SYSTEM_REVENUE' LIMIT 1`,
    );
    if (escrowResult.rows.length === 0 || revenueResult.rows.length === 0) return;

    const escrowAccountId = escrowResult.rows[0].id;
    const revenueAccountId = revenueResult.rows[0].id;

    // For honeypot proofs, penalize flagged Furies financially
    if (isHoneypot) {
      for (const furyId of result.flaggedFuries) {
        const furyUser = await this.pool.query(
          `SELECT account_id FROM users WHERE id = $1`,
          [furyId],
        );
        if (furyUser.rows.length === 0 || !furyUser.rows[0].account_id) continue;

        try {
          await this.ledger!.recordTransaction(
            furyUser.rows[0].account_id,
            revenueAccountId,
            AUDITOR_STAKE_AMOUNT,
            contractId ?? undefined,
            { type: 'FURY_PENALTY' },
          );
          await this.truthLog?.appendEvent('FURY_PENALTY_CHARGED', {
            furyUserId: furyId,
            proofId,
            amount: AUDITOR_STAKE_AMOUNT,
            reason: 'honeypot_failure',
          });
        } catch (err) {
          this.logger.error(`Failed to charge honeypot penalty for Fury ${furyId}: ${err instanceof Error ? err.message : err}`);
        }
      }
      return;
    }

    // For regular proofs with clear outcome, reward/penalize each voter
    for (const vote of votes) {
      const wasCorrect =
        (result.outcome === 'VERIFIED' && vote.verdict === 'PASS') ||
        (result.outcome === 'REJECTED' && vote.verdict === 'FAIL');

      const furyUser = await this.pool.query(
        `SELECT account_id FROM users WHERE id = $1`,
        [vote.furyUserId],
      );
      if (furyUser.rows.length === 0 || !furyUser.rows[0].account_id) continue;

      const furyAccountId = furyUser.rows[0].account_id;

      try {
        if (wasCorrect) {
          await this.ledger!.recordTransaction(
            escrowAccountId,
            furyAccountId,
            AUDITOR_STAKE_AMOUNT,
            contractId ?? undefined,
            { type: 'FURY_BOUNTY' },
          );
          await this.truthLog?.appendEvent('FURY_BOUNTY_PAID', {
            furyUserId: vote.furyUserId,
            proofId,
            amount: AUDITOR_STAKE_AMOUNT,
          });
        } else {
          await this.ledger!.recordTransaction(
            furyAccountId,
            revenueAccountId,
            AUDITOR_STAKE_AMOUNT,
            contractId ?? undefined,
            { type: 'FURY_PENALTY' },
          );
          await this.truthLog?.appendEvent('FURY_PENALTY_CHARGED', {
            furyUserId: vote.furyUserId,
            proofId,
            amount: AUDITOR_STAKE_AMOUNT,
          });
        }
      } catch (err) {
        this.logger.error(`Failed to process bounty for Fury ${vote.furyUserId}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }
}
