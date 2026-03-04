/**
 * Service to orchestrate the direct transmission of verified Daily Proof videos
 * from the mobile buffer to the Cloudflare R2 bucket holding pen.
 */

import { SessionService } from './SessionService';
import { API_BASE } from '../config/api';

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
}
