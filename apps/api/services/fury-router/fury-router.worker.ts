import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { FURY_ROUTER_QUEUE_NAME, getDefaultQueueOptions } from '../../config/queue.config';

export interface FuryRouteJobData {
  proofId: string;
  submitterUserId: string;
  requiredReviewers: number;
  dispatchedAt: string;
}

/**
 * BullMQ Worker that processes Fury review routing jobs.
 * For each submitted proof, it:
 *   1. Queries the database for N eligible Fury auditors (excluding submitter)
 *   2. Creates fury_assignments rows linking each Fury to the proof
 *   3. Logs the assignment to the event system
 *
 * This worker is the critical missing piece identified in the E2G review —
 * without it, proofs enter the queue but are never consumed.
 */
@Injectable()
export class FuryRouterWorker implements OnModuleInit {
  private readonly logger = new Logger(FuryRouterWorker.name);
  private worker!: Worker;

  constructor(private readonly pool: Pool) {}

  onModuleInit() {
    const queueOptions = getDefaultQueueOptions();

    this.worker = new Worker(
      FURY_ROUTER_QUEUE_NAME,
      async (job: Job<FuryRouteJobData>) => {
        await this.processJob(job);
      },
      {
        connection: queueOptions.connection,
        concurrency: 5,
        limiter: {
          max: 100,
          duration: 60_000, // 100 jobs per minute
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Fury routing completed for proof ${job.data.proofId}`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Fury routing failed for proof ${job?.data?.proofId}: ${err.message}`,
      );
    });

    this.logger.log('FuryRouterWorker initialized and listening for jobs');
  }

  /**
   * Core routing logic:
   * 1. Find eligible Furies (active, not the submitter, integrity >= 20)
   * 2. Randomly select N from the eligible pool
   * 3. Create fury_assignments for each selected Fury
   */
  private async processJob(job: Job<FuryRouteJobData>): Promise<void> {
    const { proofId, submitterUserId, requiredReviewers } = job.data;
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Get submitter's metadata for isolation
      const submitterResult = await client.query(
        `SELECT last_known_state, social_guild_id, enterprise_id FROM users WHERE id = $1`,
        [submitterUserId]
      );
      const submitter = submitterResult.rows[0];

      // 2. Get all users who are accountability partners for this submitter
      const partnerResult = await client.query(
        `SELECT partner_user_id FROM accountability_partners 
         JOIN contracts ON accountability_partners.contract_id = contracts.id
         WHERE contracts.user_id = $1 AND partner_user_id IS NOT NULL`,
        [submitterUserId]
      );
      const partners = partnerResult.rows.map(r => r.partner_user_id);

      // 3. Find eligible Furies with isolation:
      // - Must hold the FURY role (only auditors may review)
      // - Not the submitter
      // - Not in the same state (Geographic isolation)
      // - Not in the same social guild (Social isolation)
      // - Not in the same enterprise (Corporate isolation)
      // - Not an accountability partner
      // - Integrity score >= 20
      const eligibleResult = await client.query(
        `SELECT id FROM users
         WHERE id != $1
           AND status = 'ACTIVE'
           AND role = 'FURY'
           AND integrity_score >= 20
           -- Geographic isolation
           AND (last_known_state IS NULL OR last_known_state != $2)
           -- Social/Corporate isolation
           AND (social_guild_id IS NULL OR social_guild_id != $3)
           AND (enterprise_id IS NULL OR enterprise_id != $4)
           -- Accountability partner isolation
           AND id != ALL($5::uuid[])
         ORDER BY RANDOM()
         LIMIT $6`,
        [
          submitterUserId, 
          submitter?.last_known_state || 'UNKNOWN', 
          submitter?.social_guild_id || '00000000-0000-0000-0000-000000000000',
          submitter?.enterprise_id || '00000000-0000-0000-0000-000000000000',
          partners.length > 0 ? partners : ['00000000-0000-0000-0000-000000000000'],
          requiredReviewers
        ],
      );

      const selectedFuries = eligibleResult.rows;

      // Do not finalize consensus routing with fewer than the required reviewers — a
      // single reviewer must never constitute "full consensus".
      //
      // SH14: while retries remain, throw so the job is held with backoff until
      // enough eligible Furies are available. But once BullMQ retries are EXHAUSTED
      // we must NOT leave the proof permanently stranded in PENDING_REVIEW with no
      // assignments and no escalation path. On the final attempt we instead route it
      // to a dead-letter / manual-review status the system can later pick up, and
      // return cleanly so the job completes rather than vanishing into BullMQ's
      // failed set with no DB trace.
      if (selectedFuries.length < requiredReviewers) {
        const attemptsMade = job.attemptsMade ?? 0;
        const maxAttempts = job.opts?.attempts ?? 1;
        const isFinalAttempt = attemptsMade + 1 >= maxAttempts;

        if (!isFinalAttempt) {
          throw new Error(
            `Only ${selectedFuries.length}/${requiredReviewers} eligible Furies available for proof ${proofId}; holding for retry.`,
          );
        }

        // Final attempt: dead-letter to manual review (human escalation). Commit the
        // status transition (and its audit event) in the open transaction.
        await client.query(
          `UPDATE proofs SET status = 'MANUAL_REVIEW' WHERE id = $1`,
          [proofId],
        );
        await client.query('COMMIT');
        this.logger.warn(
          `Proof ${proofId} could not be routed (${selectedFuries.length}/${requiredReviewers} eligible Furies) ` +
            `after ${attemptsMade + 1} attempts; dead-lettered to MANUAL_REVIEW for human escalation.`,
        );
        return;
      }

      // Create fury_assignments for each selected reviewer with an identity mask.
      // Use a crypto-random alias so the mask is unpredictable / non-enumerable.
      for (const fury of selectedFuries) {
        const alias = `Target_${randomUUID().slice(0, 8)}`;
        await client.query(
          `INSERT INTO fury_assignments (proof_id, fury_user_id, subject_alias)
           VALUES ($1, $2, $3)`,
          [proofId, fury.id, alias],
        );
      }

      // Update proof status to indicate it's under review
      await client.query(
        `UPDATE proofs SET status = 'UNDER_REVIEW' WHERE id = $1`,
        [proofId],
      );

      await client.query('COMMIT');

      this.logger.log(
        `Routed proof ${proofId} to ${selectedFuries.length} Furies: [${selectedFuries.map((f: any) => f.id).join(', ')}]`,
      );
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
