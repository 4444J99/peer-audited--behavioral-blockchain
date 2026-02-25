import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { Pool } from 'pg';
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

      // Find eligible Furies: active users with sufficient integrity, not the submitter
      const eligibleResult = await client.query(
        `SELECT id FROM users
         WHERE id != $1
           AND status = 'ACTIVE'
           AND role IN ('USER', 'FURY', 'ADMIN')
           AND integrity_score >= 20
         ORDER BY RANDOM()
         LIMIT $2`,
        [submitterUserId, requiredReviewers],
      );

      const selectedFuries = eligibleResult.rows;

      if (selectedFuries.length < requiredReviewers) {
        this.logger.warn(
          `Only ${selectedFuries.length}/${requiredReviewers} eligible Furies found for proof ${proofId}. Proceeding with available reviewers.`,
        );
      }

      if (selectedFuries.length === 0) {
        throw new Error(`No eligible Furies available for proof ${proofId}`);
      }

      // Create fury_assignments for each selected reviewer
      for (const fury of selectedFuries) {
        await client.query(
          `INSERT INTO fury_assignments (proof_id, fury_user_id)
           VALUES ($1, $2)`,
          [proofId, fury.id],
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
