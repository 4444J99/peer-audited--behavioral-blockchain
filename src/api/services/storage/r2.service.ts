import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2 storage service for proof media (video, images).
 * All media is stored in R2 with zero-egress; access is via signed URLs only.
 */
@Injectable()
export class R2StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET || 'styx-proofs';
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY || '',
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY || '',
      },
    });
  }

  /**
   * Generate a pre-signed upload URL for proof media.
   * URL expires in 5 minutes. Returns both the URL and the storage key.
   */
  async generateUploadUrl(proofId: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
    const ext = contentType.split('/')[1] || 'bin';
    const key = `proofs/${proofId}/${Date.now()}.${ext}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
    return { uploadUrl, key };
  }

  /**
   * Generate a pre-signed view URL for proof media.
   * URL expires in 1 hour. Fury auditors use this to view proof submissions.
   */
  async generateViewUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  /**
   * Download a file from R2 as a Buffer.
   * Used by PHashService for perceptual hash computation on proof media.
   */
  async downloadFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.s3Client.send(command);
    const stream = response.Body as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
