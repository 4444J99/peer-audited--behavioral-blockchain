import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VideoProcessingService } from './video-processing.service';

/**
 * The redaction safety net.
 *
 * `ProofsController.confirmUpload` enqueues redaction inline, but that call can
 * fail (Redis blip, queue backpressure) and it deliberately does not abort the
 * upload when it does. Without a sweeper a proof that missed its enqueue stays
 * `NOT_STARTED` forever — and since the Fury queue now fails CLOSED, that means
 * a permanently unreviewable proof.
 *
 * `dispatchPendingProofs` is idempotent by construction: its UPDATE matches only
 * rows still in `NOT_STARTED`, so a proof already queued or processing is never
 * double-dispatched, and a sweep that overlaps an inline dispatch is harmless.
 */
@Injectable()
export class VideoProcessingScheduler {
  private readonly logger = new Logger(VideoProcessingScheduler.name);

  constructor(private readonly videoProcessing: VideoProcessingService) {}

  @Cron('0 */10 * * * *') // every 10 minutes
  async sweepPendingProofs(): Promise<void> {
    try {
      const dispatched = await this.videoProcessing.dispatchPendingProofs();
      if (dispatched > 0) {
        this.logger.log(`Redaction sweep dispatched ${dispatched} proof(s) that missed their inline enqueue.`);
      }
    } catch (error) {
      this.logger.error(`Redaction sweep failed: ${(error as Error)?.message}`);
    }
  }
}
