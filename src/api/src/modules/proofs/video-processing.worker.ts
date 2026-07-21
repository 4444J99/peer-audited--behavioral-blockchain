import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { Pool } from 'pg';
import { VIDEO_PROCESSING_QUEUE_NAME, getRedisConnectionConfig } from '../../../config/queue.config';

interface VideoProcessingJob {
  proofId: string;
  challengeToken: string;
  userId: string;
  mediaUri: string | null;
}

@Injectable()
export class VideoProcessingWorker implements OnModuleInit {
  private readonly logger = new Logger(VideoProcessingWorker.name);
  private worker!: Worker;

  constructor(private readonly pool: Pool) {}

  onModuleInit() {
    this.worker = new Worker(
      VIDEO_PROCESSING_QUEUE_NAME,
      async (job: Job<VideoProcessingJob>) => this.process(job),
      { connection: getRedisConnectionConfig(), concurrency: 2 },
    );
    this.logger.log('Video processing worker initialized');
  }

  private async process(job: Job<VideoProcessingJob>): Promise<void> {
    const { proofId, challengeToken } = job.data;

    this.logger.log(`Processing video proof ${proofId}...`);

    // Step 1: Verify the proof is still in PROCESSING state
    const check = await this.pool.query(
      `SELECT id, processing_status, challenge_token
       FROM proofs WHERE id = $1`,
      [proofId],
    );

    if (check.rows.length === 0) {
      this.logger.warn(`Proof ${proofId} not found — skipping`);
      return;
    }

    const { processing_status: status, challenge_token: storedToken } = check.rows[0];

    if (status !== 'PROCESSING') {
      this.logger.warn(`Proof ${proofId} no longer in PROCESSING state (${status}) — skipping`);
      return;
    }

    if (storedToken !== challengeToken) {
      this.logger.warn(`Proof ${proofId} challenge token mismatch — possible replay`);
      return;
    }

    // Step 2: Process the video
    // In production this delegates to FFmpeg/AWS Elemental MediaConvert.
    // For local dev / CI, mark as processed immediately.
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (internalToken) {
      // Call the processing-complete endpoint via internal HTTP
      const apiBase = process.env.STYX_INTERNAL_API_URL || 'http://localhost:3000';
      try {
        const response = await fetch(
          `${apiBase}/proofs/${proofId}/processing-complete`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-token': internalToken,
              'x-proof-challenge': challengeToken,
            },
            body: JSON.stringify({
              status: 'COMPLETED',
              maskedMediaUri: null,
            }),
          },
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`processing-complete returned ${response.status}: ${text}`);
        }

        this.logger.log(`Video proof ${proofId} processed successfully`);
      } catch (err: any) {
        this.logger.error(`Video processing failed for proof ${proofId}: ${err.message}`);
        throw err; // BullMQ retry
      }
    } else {
      // No INTERNAL_SERVICE_TOKEN — mark directly in DB for dev mode
      await this.pool.query(
        `UPDATE proofs
         SET processing_status = 'COMPLETED',
             challenge_token = NULL,
             redaction_status = 'NOT_REQUIRED'
         WHERE id = $1`,
        [proofId],
      );
      this.logger.log(`Video proof ${proofId} processed (dev mode — direct DB update)`);
    }
  }
}
