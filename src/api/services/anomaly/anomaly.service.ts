import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import sharp from 'sharp';
import Redis from 'ioredis';
import { createHash } from 'crypto';

const PHASH_HAMMING_THRESHOLD = 5;
const EXIF_DISCREPANCY_HOURS = 1;
const ANALYSIS_TIMEOUT_MS = 10_000;
const HASH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export const ANOMALY_REDIS_CLIENT = 'ANOMALY_REDIS_CLIENT';

export interface AnomalyResult {
  rejected: boolean;
  reason?: string;
  flags: string[];
}

@Injectable()
export class AnomalyService {
  private readonly logger = new Logger(AnomalyService.name);

  // Fallback in-memory store when Redis is unavailable
  private readonly memoryStore = new Map<string, { hash: string; userId: string; mediaUri: string; id: number }[]>();
  private nextId = 0;

  constructor(
    @Optional() @Inject(ANOMALY_REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  /**
   * Analyze media for anomalies (duplicates, edits, timestamp discrepancies).
   */
  async analyze(mediaInput: Buffer | string, userId: string, mediaUri?: string): Promise<AnomalyResult> {
    const resolvedMediaUri = typeof mediaInput === 'string' ? mediaInput : (mediaUri ?? 'buffer://unknown');
    const flags: string[] = [];

    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Analysis timeout')), ANALYSIS_TIMEOUT_MS);
    });

    try {
      const result = await Promise.race([
        this.runAnalysis(mediaInput, userId, resolvedMediaUri, flags),
        timeoutPromise,
      ]);

      return result as AnomalyResult;
    } catch (err) {
      // Fail CLOSED: this is a real-money fraud screen. A timeout (or any analysis
      // failure) must not auto-accept media. Reject and surface for manual review.
      this.logger.warn(`Anomaly analysis failed for ${resolvedMediaUri}, failing closed for manual review`);
      return {
        rejected: true,
        reason: 'Anomaly analysis could not complete; held for manual review',
        flags: ['ANALYSIS_TIMEOUT', 'MANUAL_REVIEW_REQUIRED'],
      };
    } finally {
      clearTimeout(timeoutId!);
    }
  }

  /**
   * Identity hash for admin collision scans.
   *
   * IMPORTANT: this is a CRYPTOGRAPHIC hash of the media URI string, NOT a
   * perceptual hash. It can only detect the *same stored object* referenced by
   * two proofs — it can NOT detect re-encoded / visually near-duplicate media (a
   * one-byte change yields a completely different digest). Authoritative
   * near-duplicate detection is performed at upload time by PHashService against
   * the actual frame bytes and stored in `proof_hashes`.
   *
   * The previous implementation truncated the digest to 16 chars and the caller
   * compared it with a Hamming-distance threshold, which is meaningless for crypto
   * hashes: unrelated digests differ in ~half their bits (so the threshold never
   * legitimately fired) yet could in principle false-positive. We now return the
   * full digest and treat comparison as EXACT equality (see hammingDistance).
   *
   * (residual) Without the original frame bytes here, this scan cannot find
   * perceptual duplicates; use proof_hashes for that.
   */
  computePHash(mediaUri: string): string {
    return createHash('sha256').update(mediaUri).digest('hex');
  }

  /**
   * "Distance" between two identity hashes produced by computePHash. These are
   * crypto digests, so partial similarity is meaningless: either the underlying
   * media URI is identical (distance 0) or it is different (treated as "not a
   * duplicate"). This makes the admin scan's `distance < N` check behave as an
   * exact-match check rather than a spurious near-duplicate heuristic.
   */
  hammingDistance(hash1: string, hash2: string): number {
    if (typeof hash1 !== 'string' || typeof hash2 !== 'string') {
      return Number.MAX_SAFE_INTEGER;
    }
    return hash1 === hash2 ? 0 : Number.MAX_SAFE_INTEGER;
  }

  private async runAnalysis(mediaInput: Buffer | string, userId: string, mediaUri: string, flags: string[]): Promise<AnomalyResult> {
    // 1. Perceptual Hash (pHash) Duplicate Detection
    // In MVP, we use URI-based pHash if buffer analysis fails or for simplicity.
    // For TKT-P0-002, we rely on ProofsController passing the frameHash.
    // Here we focus on EXIF and metadata integrity.

    // 2. EXIF Software Check (Edit Detection)
    const softwareFlag = await this.checkExifSoftware(mediaInput);
    if (softwareFlag) {
      flags.push('SOFTWARE_MANIPULATION_DETECTED');
    }

    // 3. EXIF Timestamp Discrepancy
    const timestampFlag = await this.checkExifTimestamp(mediaInput);
    if (timestampFlag) {
      flags.push('EXIF_TIMESTAMP_DISCREPANCY');
    }

    // 4. Missing Native Metadata
    const metadata = await sharp(mediaInput).metadata();
    if (!metadata.exif && !metadata.iptc && !metadata.xmp) {
      flags.push('STRIPPED_METADATA');
    }

    return { rejected: false, flags };
  }

  async checkExifSoftware(mediaInput: Buffer | string): Promise<boolean> {
    try {
      const metadata = await sharp(mediaInput).metadata();
      if (!metadata.exif) return false;

      const exifString = metadata.exif.toString('utf-8').toLowerCase();
      const bannedSoftware = ['photoshop', 'adobe', 'lightroom', 'gimp', 'canva', 'figma'];
      
      for (const software of bannedSoftware) {
        if (exifString.includes(software)) {
          this.logger.warn(`Banned software detected in EXIF: ${software}`);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async checkExifTimestamp(mediaInput: Buffer | string): Promise<boolean> {
    try {
      const metadata = await sharp(mediaInput).metadata();
      if (!metadata.exif) return false;

      // Search for DateTimeOriginal pattern: YYYY:MM:DD HH:MM:SS
      const exifString = metadata.exif.toString('binary');
      const match = exifString.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
      if (!match) return false;

      const [, year, month, day, hour, minute, second] = match;
      const exifDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
      
      if (isNaN(exifDate.getTime())) return false;

      const now = new Date();
      const diffHours = Math.abs(now.getTime() - exifDate.getTime()) / (1000 * 60 * 60);

      if (diffHours > EXIF_DISCREPANCY_HOURS) {
        this.logger.warn(`EXIF timestamp discrepancy: ${diffHours.toFixed(1)}h`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
