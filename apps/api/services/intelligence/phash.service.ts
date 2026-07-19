import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

/**
 * Perceptual hash (pHash) service for video frame deduplication.
 *
 * SH13: upgraded from average-hash to a DIFFERENCE HASH (dHash). dHash encodes the
 * gradient (brightness difference between horizontally-adjacent pixels) rather than
 * each pixel's relation to a single global average. This is materially more robust
 * to global brightness/contrast shifts and re-encoding (common fraud-evasion
 * tactics) while staying dependency-free (sharp only) and the same 64-bit width.
 *
 * LIMITATIONS (documented, by design): a 64-bit dHash is still defeatable by large
 * geometric transforms (heavy crops, rotations, mirroring) — it is a near-duplicate
 * detector, not a content-identity oracle. The Hamming match threshold is
 * configurable via PHASH_HAMMING_THRESHOLD so it can be tuned per environment
 * without a code change; a true rotation/crop-invariant upgrade (e.g. DCT pHash or
 * feature descriptors) is tracked as future work.
 */
@Injectable()
export class PHashService {
  private readonly HASH_SIZE = 8;
  // dHash compares each pixel with its right neighbour, so the source thumbnail is
  // (HASH_SIZE + 1) wide × HASH_SIZE tall, yielding HASH_SIZE*HASH_SIZE = 64 bits.
  private readonly HASH_WIDTH = this.HASH_SIZE + 1;
  // Configurable Hamming match threshold (default tightened from 10 to 8: ~12.5% of
  // 64 bits). Lower = stricter (fewer false-positive duplicate flags); raise via env
  // if legitimate re-encodes are being flagged.
  private readonly HAMMING_THRESHOLD = (() => {
    const raw = Number(process.env.PHASH_HAMMING_THRESHOLD);
    return Number.isInteger(raw) && raw >= 0 && raw <= 64 ? raw : 8;
  })();

  /**
   * Compute a perceptual hash (dHash) for a single video frame.
   * Resizes to (HASH_SIZE+1)xHASH_SIZE grayscale, encodes the horizontal gradient
   * (1 bit per adjacent-pixel comparison), returns a 16-char hex string (64 bits).
   */
  async computeFrameHash(frameBuffer: Buffer): Promise<string> {
    const { data } = await sharp(frameBuffer)
      .resize(this.HASH_WIDTH, this.HASH_SIZE, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let bits = '';
    for (let row = 0; row < this.HASH_SIZE; row++) {
      const rowStart = row * this.HASH_WIDTH;
      for (let col = 0; col < this.HASH_SIZE; col++) {
        const left = data[rowStart + col];
        const right = data[rowStart + col + 1];
        bits += left > right ? '1' : '0';
      }
    }
    return BigInt('0b' + bits).toString(16).padStart(16, '0');
  }

  /**
   * Validate that a stored/candidate hash is a well-formed hex pHash before it is
   * parsed. Malformed input (non-hex chars, empty, or wrong length) must NOT be
   * silently coerced — it is a processing failure that the caller treats as
   * fail-closed (see ProofsController dedup). Throwing here, rather than letting
   * BigInt throw on partially-valid input, makes the failure explicit.
   */
  private assertValidHash(hash: string): void {
    if (typeof hash !== 'string' || !/^[0-9a-fA-F]+$/.test(hash)) {
      throw new Error('Malformed pHash: expected a non-empty hex string');
    }
    // Average-hash over an 8x8 grid is 64 bits = 16 hex chars. Reject anything that
    // is not exactly that length so a truncated/over-long hash cannot be compared.
    if (hash.length !== this.HASH_SIZE * 2) {
      throw new Error(`Malformed pHash: expected ${this.HASH_SIZE * 2} hex chars, got ${hash.length}`);
    }
  }

  /**
   * Compute hamming distance between two hex hash strings.
   * Lower distance = more similar images. 0 = identical.
   */
  hammingDistance(hash1: string, hash2: string): number {
    this.assertValidHash(hash1);
    this.assertValidHash(hash2);
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
