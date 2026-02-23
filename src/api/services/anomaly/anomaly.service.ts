import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

const PHASH_HAMMING_THRESHOLD = 5;
const EXIF_DISCREPANCY_HOURS = 1;
const ANALYSIS_TIMEOUT_MS = 10_000;

export interface AnomalyResult {
  rejected: boolean;
  reason?: string;
  flags: string[];
}

@Injectable()
export class AnomalyService {
  private readonly logger = new Logger(AnomalyService.name);

  // In-memory pHash store (production would use Redis sorted set)
  private readonly hashStore = new Map<string, { hash: string; userId: string; mediaUri: string; id: number }[]>();
  private nextId = 0;

  async analyze(mediaUri: string, userId: string): Promise<AnomalyResult> {
    const flags: string[] = [];

    try {
      const result = await Promise.race([
        this.runAnalysis(mediaUri, userId, flags),
        this.timeout(ANALYSIS_TIMEOUT_MS),
      ]);

      return result as AnomalyResult;
    } catch (err) {
      // Fail-open on timeout — pass to Fury with unverified flag
      this.logger.warn(`Anomaly analysis timed out for ${mediaUri}, failing open`);
      return { rejected: false, flags: ['ANALYSIS_TIMEOUT', 'UNVERIFIED'] };
    }
  }

  private async runAnalysis(mediaUri: string, userId: string, flags: string[]): Promise<AnomalyResult> {
    // 1. pHash duplicate detection — check BEFORE storing
    const pHash = this.computePHash(mediaUri);
    const duplicate = this.checkDuplicate(pHash);
    if (duplicate) {
      return {
        rejected: true,
        reason: `Duplicate media detected (Hamming distance < ${PHASH_HAMMING_THRESHOLD}). Original: ${duplicate.mediaUri}`,
        flags: ['PHASH_DUPLICATE'],
      };
    }

    // Store the hash for future comparisons
    this.storeHash(pHash, userId, mediaUri);

    // 2. EXIF timestamp validation
    const exifFlag = await this.checkExifTimestamp(mediaUri);
    if (exifFlag) {
      flags.push('EXIF_TIMESTAMP_DISCREPANCY');
    }

    return { rejected: false, flags };
  }

  /**
   * Compute a perceptual hash of the media.
   * In production, this would use imghash/ffmpeg to extract a frame and compute a real pHash.
   * For now, we use a deterministic hash based on the URI to enable testing.
   */
  computePHash(mediaUri: string): string {
    let hash = 0n;
    for (let i = 0; i < mediaUri.length; i++) {
      hash = ((hash << 5n) - hash + BigInt(mediaUri.charCodeAt(i))) & 0xFFFFFFFFFFFFFFFFn;
    }
    return hash.toString(16).padStart(16, '0');
  }

  /**
   * Compute Hamming distance between two hex-encoded hashes.
   */
  hammingDistance(a: string, b: string): number {
    let distance = 0;
    const aBig = BigInt('0x' + a);
    const bBig = BigInt('0x' + b);
    let xor = aBig ^ bBig;
    while (xor > 0n) {
      distance += Number(xor & 1n);
      xor >>= 1n;
    }
    return distance;
  }

  private checkDuplicate(pHash: string): { mediaUri: string } | null {
    // Check all stored hashes for collisions
    for (const [, entries] of this.hashStore) {
      for (const entry of entries) {
        const distance = this.hammingDistance(pHash, entry.hash);
        if (distance < PHASH_HAMMING_THRESHOLD) {
          return { mediaUri: entry.mediaUri };
        }
      }
    }
    return null;
  }

  private storeHash(pHash: string, userId: string, mediaUri: string): void {
    const key = userId;
    const entries = this.hashStore.get(key) || [];
    entries.push({ hash: pHash, userId, mediaUri, id: this.nextId++ });
    this.hashStore.set(key, entries);
  }

  /**
   * Extract EXIF DateTimeOriginal from media and compare against current time.
   * Flags if discrepancy exceeds EXIF_DISCREPANCY_HOURS.
   * Falls back gracefully when media is not a local file or has no EXIF data.
   */
  async checkExifTimestamp(mediaUri: string): Promise<boolean> {
    try {
      // Only process local file paths or R2 URLs — skip non-image URIs
      if (!mediaUri || mediaUri.startsWith('http')) {
        // For remote URLs, we'd need to fetch the file first.
        // In production, proofs are fetched from R2 via signed URL before analysis.
        return false;
      }

      const metadata = await sharp(mediaUri).metadata();
      const exifBuffer = metadata.exif;
      if (!exifBuffer) return false;

      const exifDateMatch = exifBuffer.toString('binary').match(
        /(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/,
      );
      if (!exifDateMatch) return false;

      const [, year, month, day, hour, minute, second] = exifDateMatch;
      const exifDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);

      if (isNaN(exifDate.getTime())) return false;

      const now = new Date();
      const diffHours = Math.abs(now.getTime() - exifDate.getTime()) / (1000 * 60 * 60);

      if (diffHours > EXIF_DISCREPANCY_HOURS) {
        this.logger.warn(
          `EXIF timestamp discrepancy: ${diffHours.toFixed(1)}h for ${mediaUri}`,
        );
        return true;
      }

      return false;
    } catch (err) {
      // Non-image files, corrupted EXIF, etc. — fail open
      this.logger.debug(`EXIF check skipped for ${mediaUri}: ${(err as Error).message}`);
      return false;
    }
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Analysis timeout')), ms),
    );
  }
}
