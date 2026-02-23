import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

/**
 * Perceptual hash (pHash) service for video frame deduplication.
 * Uses average-hash algorithm on 8x8 grayscale thumbnails.
 * Detects near-duplicate proof submissions to prevent fraud.
 */
@Injectable()
export class PHashService {
  private readonly HASH_SIZE = 8;
  private readonly HAMMING_THRESHOLD = 10;

  /**
   * Compute a perceptual hash for a single video frame.
   * Resizes to 8x8 grayscale, computes average hash, returns 16-char hex string.
   */
  async computeFrameHash(frameBuffer: Buffer): Promise<string> {
    const { data } = await sharp(frameBuffer)
      .resize(this.HASH_SIZE, this.HASH_SIZE, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = Array.from(data);
    const avg = pixels.reduce((sum, p) => sum + p, 0) / pixels.length;
    const bits = pixels.map((p) => (p >= avg ? '1' : '0')).join('');
    return BigInt('0b' + bits).toString(16).padStart(16, '0');
  }

  /**
   * Compute hamming distance between two hex hash strings.
   * Lower distance = more similar images. 0 = identical.
   */
  hammingDistance(hash1: string, hash2: string): number {
    const a = BigInt('0x' + hash1);
    const b = BigInt('0x' + hash2);
    let xor = a ^ b;
    let dist = 0;
    while (xor > 0n) {
      dist += Number(xor & 1n);
      xor >>= 1n;
    }
    return dist;
  }

  /**
   * Check if a frame is a near-duplicate of any frame in the existing set.
   * Returns duplicate status and closest hamming distance found.
   */
  async isDuplicate(
    frameBuffer: Buffer,
    existingHashes: string[],
  ): Promise<{ duplicate: boolean; closestDistance: number }> {
    const newHash = await this.computeFrameHash(frameBuffer);
    let closestDistance = Infinity;

    for (const existing of existingHashes) {
      const dist = this.hammingDistance(newHash, existing);
      closestDistance = Math.min(closestDistance, dist);
      if (dist < this.HAMMING_THRESHOLD) {
        return { duplicate: true, closestDistance: dist };
      }
    }

    return { duplicate: false, closestDistance };
  }

  /**
   * Extract perceptual hashes for an array of video frame buffers.
   */
  async extractFrameHashes(videoFrames: Buffer[]): Promise<string[]> {
    return Promise.all(videoFrames.map((frame) => this.computeFrameHash(frame)));
  }
}
