import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Pool } from 'pg';
import { randomBytes } from 'crypto';
import { VIDEO_PROCESSING_QUEUE_NAME, getDefaultQueueOptions } from '../../../config/queue.config';

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);
  private queue: Queue;

  constructor(private readonly pool: Pool) {
    this.queue = new Queue(VIDEO_PROCESSING_QUEUE_NAME, getDefaultQueueOptions());
  }

  async dispatchForProcessing(proofId: string): Promise<void> {
    const challengeToken = randomBytes(32).toString('hex');

    const result = await this.pool.query(
      `UPDATE proofs
       SET processing_status = 'PROCESSING',
           challenge_token = $1
       WHERE id = $2
         AND processing_status = 'NOT_STARTED'
         AND (media_uri IS NOT NULL OR proof_type = 'MEDIA')
       RETURNING id, user_id, media_uri`,
      [challengeToken, proofId],
    );

    if (result.rows.length === 0) {
      this.logger.warn(`Proof ${proofId} not eligible for processing — already processing or no media`);
      return;
    }

    await this.queue.add('process-video', {
      proofId,
      challengeToken,
      userId: result.rows[0].user_id,
      mediaUri: result.rows[0].media_uri,
    });

    this.logger.log(`Dispatched proof ${proofId} for video processing`);
  }

  async dispatchPendingProofs(): Promise<number> {
    const result = await this.pool.query(
      `SELECT id FROM proofs
       WHERE processing_status = 'NOT_STARTED'
         AND (media_uri IS NOT NULL OR proof_type = 'MEDIA')
       LIMIT 50`,
    );

    for (const row of result.rows) {
      await this.dispatchForProcessing(row.id).catch((err) => {
        this.logger.error(`Failed to dispatch proof ${row.id}: ${err.message}`);
      });
    }

    return result.rows.length;
  }
}
