/**
 * Service to orchestrate the direct transmission of verified Daily Proof videos
 * from the mobile buffer to the Cloudflare R2 bucket holding pen.
 */

import { SessionService } from './SessionService';
import { ApiClient } from './ApiClient';
import type { ProofProcessingStatus } from './ApiClient';
import { API_BASE } from '../config/api';

/** First gap between processing-status polls. */
export const PROCESSING_POLL_INITIAL_MS = 2_000;
/** Ceiling the exponential backoff settles at. */
export const PROCESSING_POLL_MAX_MS = 30_000;
/** Total wall-clock budget before the client stops asking and surfaces a retry. */
export const PROCESSING_POLL_DEADLINE_MS = 300_000;

const TERMINAL_PROCESSING_STATUSES = ['COMPLETED', 'FAILED'];

function isTerminalProcessingStatus(overallStatus: string): boolean {
  return TERMINAL_PROCESSING_STATUSES.includes(overallStatus);
}

export interface ProcessingPollOptions {
  initialDelayMs?: number;
  maxDelayMs?: number;
  deadlineMs?: number;
  /** Injected in tests so the poll runs without real timers. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  /** Polled between rounds so an unmounting view can stop the loop. */
  isCancelled?: () => boolean;
}

export class UploadService {
  /**
   * Contacts the NestJS backend to retrieve an authenticated, pre-signed Cloudflare R2 URL.
   * This authorizes a direct client-to-storage upload, bypassing API bottlenecking.
   */
  static async requestPreSignedUrl(
    contractId: string,
    fileType: string,
    description?: string,
  ): Promise<{ uploadUrl: string; proofId: string; storageKey: string }> {
    console.log(`UploadService: Requesting Pre-Signed URL for ${fileType} (contract=${contractId})...`);

    const token = await SessionService.getToken();
    const res = await fetch(`${API_BASE}/proofs/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        contractId,
        contentType: fileType,
        description: description || undefined,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to request pre-signed URL: ${res.status}`);
    }

    const data = await res.json();
    console.log(`UploadService: Pre-Signed URL received for proof [${data.proofId}]`);
    return {
      uploadUrl: data.uploadUrl,
      proofId: data.proofId,
      storageKey: data.storageKey,
    };
  }

  /**
   * Executes a PUT request to push the local binary video file to the pre-signed remote bucket.
   * @param localUri The fast-storage URI returned by the CameraModule
   * @param presignedUrl The URL obtained from requestPreSignedUrl
   */
  static async uploadVideoBuffer(localUri: string, presignedUrl: string): Promise<boolean> {
    console.log(`UploadService: Transmitting video buffer [${localUri}] to [${presignedUrl.substring(0, 30)}...]`);

    try {
      const response = await fetch(localUri);
      const blob = await response.blob();

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: blob,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }

      console.log('UploadService: Transmission verified. Payload secured in R2.');
      return true;
    } catch (e) {
      console.error('UploadService: Transmission failed', e);
      return false;
    }
  }

  /**
   * Notifies the Styx API that the upload is complete, dispatching the job to the BullMQ Fury Router.
   */
  static async confirmUpload(proofId: string, storageKey: string): Promise<boolean> {
    console.log(`UploadService: Confirming upload for Proof [${proofId}]. Dispatching to Fury Router...`);

    const token = await SessionService.getToken();
    const res = await fetch(`${API_BASE}/proofs/${proofId}/confirm-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ storageKey }),
    });

    if (!res.ok) {
      console.error(`UploadService: Dispatch failed with status ${res.status}`);
      return false;
    }

    return true;
  }

  /**
   * Reads the backend video-processing pipeline state for one proof.
   *
   * Routed through ApiClient rather than a bare fetch so the caller gets the
   * shared error-envelope parsing (request_id, error_code). `getToken()` is
   * awaited for its side effect: it rehydrates ApiClient's in-memory auth token
   * after a cold start, where only AsyncStorage still holds the session.
   */
  static async getProcessingStatus(proofId: string): Promise<ProofProcessingStatus> {
    await SessionService.getToken();
    return ApiClient.getProcessingStatus(proofId);
  }

  /**
   * Polls the processing pipeline until it reaches a terminal state, reporting
   * every reading through `onUpdate` so a view can render progress live.
   *
   * Backs off exponentially from 2s to a 30s ceiling under a 5-minute budget:
   * transcode + redact runs on a BullMQ worker with its own retries, so a tight
   * poll would hammer the API for minutes with nothing new to say.
   *
   * Resolves with the terminal reading, or `null` if `isCancelled` went true.
   * Rejects only when the deadline passes without a terminal state — a fetch
   * failure mid-poll is transient (the worker is unaffected) and is retried
   * until that same deadline.
   */
  static async pollProcessingStatus(
    proofId: string,
    onUpdate: (status: ProofProcessingStatus) => void,
    options: ProcessingPollOptions = {},
  ): Promise<ProofProcessingStatus | null> {
    const initialDelayMs = options.initialDelayMs ?? PROCESSING_POLL_INITIAL_MS;
    const maxDelayMs = options.maxDelayMs ?? PROCESSING_POLL_MAX_MS;
    const deadlineMs = options.deadlineMs ?? PROCESSING_POLL_DEADLINE_MS;
    const now = options.now ?? (() => Date.now());
    const sleep =
      options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
    const isCancelled = options.isCancelled ?? (() => false);

    const startedAt = now();
    let delayMs = initialDelayMs;
    let lastError: string | null = null;

    while (!isCancelled()) {
      try {
        const status = await UploadService.getProcessingStatus(proofId);
        lastError = null;
        if (isCancelled()) {
          return null;
        }
        onUpdate(status);
        if (isTerminalProcessingStatus(status.overallStatus)) {
          return status;
        }
      } catch (e: any) {
        lastError = e?.message || String(e);
        console.warn(`UploadService: Processing-status poll failed for ${proofId}: ${lastError}`);
      }

      const remainingMs = deadlineMs - (now() - startedAt);
      if (remainingMs <= 0) {
        throw new Error(
          lastError
            ? `Could not reach the processing pipeline: ${lastError}`
            : `Proof is still processing after ${Math.round(deadlineMs / 1000)}s.`,
        );
      }

      await sleep(Math.min(delayMs, remainingMs));
      delayMs = Math.min(delayMs * 2, maxDelayMs);
    }

    return null;
  }
}
