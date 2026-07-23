import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Worker, Job } from "bullmq";
import { Pool } from "pg";
import {
  VIDEO_PROCESSING_QUEUE_NAME,
  getRedisConnectionConfig,
} from "../../../config/queue.config";
import { TranscodingService } from "../../../services/media/transcoding.service";
import { R2StorageService } from "../../../services/storage/r2.service";

interface VideoProcessingJob {
  proofId: string;
  challengeToken: string;
  userId: string;
  mediaUri: string | null;
}

/**
 * VideoProcessingWorker — processes proof videos through the transcoding pipeline.
 *
 * Pipeline stages:
 * 1. VALIDATE — verify the source video is decodable
 * 2. TRANSCODE — re-encode to H.264/AAC for universal playback
 * 3. THUMBNAIL — extract a midpoint frame for reviewer preview
 * 4. STORE — upload transcoded video + thumbnail to R2
 * 5. COMPLETE — finalize proof with processed media URIs
 *
 * Each stage is tracked in proof_processing_jobs for observability.
 * Failed stages are retried by BullMQ with exponential backoff.
 */
@Injectable()
export class VideoProcessingWorker implements OnModuleInit {
  private readonly logger = new Logger(VideoProcessingWorker.name);
  private worker!: Worker;

  constructor(
    private readonly pool: Pool,
    private readonly transcoding: TranscodingService,
    private readonly r2: R2StorageService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      VIDEO_PROCESSING_QUEUE_NAME,
      async (job: Job<VideoProcessingJob>) => this.process(job),
      { connection: getRedisConnectionConfig(), concurrency: 2 },
    );
    this.logger.log("Video processing worker initialized");
  }

  private async process(job: Job<VideoProcessingJob>): Promise<void> {
    const { proofId, challengeToken, mediaUri } = job.data;

    this.logger.log(`Processing video proof ${proofId}...`);

    // Verify the proof is still in PROCESSING state with matching challenge token
    const check = await this.pool.query(
      `SELECT id, processing_status, challenge_token, content_type
       FROM proofs WHERE id = $1`,
      [proofId],
    );

    if (check.rows.length === 0) {
      this.logger.warn(`Proof ${proofId} not found — skipping`);
      return;
    }

    const {
      processing_status: status,
      challenge_token: storedToken,
      content_type: contentType,
    } = check.rows[0];

    if (status !== "PROCESSING") {
      this.logger.warn(
        `Proof ${proofId} no longer in PROCESSING state (${status}) — skipping`,
      );
      return;
    }

    if (storedToken !== challengeToken) {
      this.logger.warn(
        `Proof ${proofId} challenge token mismatch — possible replay`,
      );
      return;
    }

    if (!mediaUri) {
      this.logger.warn(`Proof ${proofId} has no media URI — skipping`);
      return;
    }

    try {
      // Stage 1: Download source video from R2
      await this.recordStage(proofId, "DOWNLOAD", "IN_PROGRESS");
      const sourceBuffer = await this.r2.downloadFile(mediaUri);
      await this.recordStage(proofId, "DOWNLOAD", "COMPLETED");

      // Stage 2: Validate source video
      await this.recordStage(proofId, "VALIDATE", "IN_PROGRESS");
      const valid = await this.transcoding.validateVideo(sourceBuffer, contentType);
      if (!valid) {
        await this.recordStage(proofId, "VALIDATE", "FAILED", "Source video is not decodable");
        throw new Error("Source video validation failed");
      }
      await this.recordStage(proofId, "VALIDATE", "COMPLETED");

      // Stage 3: Transcode to H.264/AAC + generate thumbnail
      await this.recordStage(proofId, "TRANSCODE", "IN_PROGRESS");
      const { transcodedBuffer, thumbnailBuffer, metadata } =
        await this.transcoding.transcode(sourceBuffer, contentType);
      await this.recordStage(proofId, "TRANSCODE", "COMPLETED");

      // Stage 4: Upload processed files to R2
      await this.recordStage(proofId, "STORE", "IN_PROGRESS");
      const [transcodedKey, thumbnailKey] = await Promise.all([
        this.r2.uploadBuffer(
          transcodedBuffer,
          `proofs/${proofId}/transcoded.mp4`,
          "video/mp4",
        ),
        this.r2.uploadBuffer(
          thumbnailBuffer,
          `proofs/${proofId}/thumbnail.jpg`,
          "image/jpeg",
        ),
      ]);
      await this.recordStage(proofId, "STORE", "COMPLETED");

      // Stage 5: Finalize proof with processed media
      await this.recordStage(proofId, "FINALIZE", "IN_PROGRESS");
      const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
      if (internalToken) {
        // Call the processing-complete endpoint with the transcoded media
        const apiBase =
          process.env.STYX_INTERNAL_API_URL || "http://localhost:3000";
        const response = await fetch(
          `${apiBase}/proofs/${proofId}/processing-complete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-token": internalToken,
              "x-proof-challenge": challengeToken,
            },
            body: JSON.stringify({
              status: "COMPLETED",
              maskedMediaUri: transcodedKey,
            }),
          },
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `processing-complete returned ${response.status}: ${text}`,
          );
        }
      } else {
        // Dev mode: update DB directly
        await this.pool.query(
          `UPDATE proofs
           SET processing_status = 'COMPLETED',
               masked_media_uri = $1,
               challenge_token = NULL,
               redaction_status = 'NOT_REQUIRED'
           WHERE id = $2`,
          [transcodedKey, proofId],
        );
      }

      // Store metadata for downstream use
      await this.pool.query(
        `UPDATE proofs
         SET device_metadata = COALESCE(device_metadata, '{}')::jsonb || $1::jsonb
         WHERE id = $2`,
        [
          JSON.stringify({
            transcoded: true,
            duration: metadata.duration,
            resolution: `${metadata.width}x${metadata.height}`,
            codec: metadata.codec,
            fps: metadata.fps,
            thumbnailKey,
          }),
          proofId,
        ],
      );

      await this.recordStage(proofId, "FINALIZE", "COMPLETED");
      this.logger.log(
        `Video proof ${proofId} processed: ${metadata.duration}s, ${metadata.width}x${metadata.height}, ${metadata.codec}`,
      );
    } catch (err: any) {
      this.logger.error(`Video processing failed for proof ${proofId}: ${err.message}`);
      await this.recordStage(
        proofId,
        "ERROR",
        "FAILED",
        err.message?.slice(0, 500),
      );
      throw err; // BullMQ retry
    }
  }

  /**
   * Records a processing stage in proof_processing_jobs for observability.
   */
  private async recordStage(
    proofId: string,
    stage: string,
    status: string,
    error?: string,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO proof_processing_jobs (proof_id, stage, status, error)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [proofId, stage, status, error || null],
    ).catch((err) => {
      this.logger.warn(`Failed to record stage ${stage} for ${proofId}: ${err.message}`);
    });
  }
}
