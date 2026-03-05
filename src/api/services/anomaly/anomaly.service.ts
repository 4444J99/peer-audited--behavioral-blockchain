import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import sharp from 'sharp';
import Redis from 'ioredis';

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
  async analyze(mediaBuffer: Buffer, userId: string, mediaUri: string): Promise<AnomalyResult> {
    const flags: string[] = [];

    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Analysis timeout')), ANALYSIS_TIMEOUT_MS);
    });

    try {
      const result = await Promise.race([
        this.runAnalysis(mediaBuffer, userId, mediaUri, flags),
        timeoutPromise,
      ]);

      return result as AnomalyResult;
    } catch (err) {
      this.logger.warn(`Anomaly analysis timed out for ${mediaUri}, failing open`);
      return { rejected: false, flags: ['ANALYSIS_TIMEOUT', 'UNVERIFIED'] };
    } finally {
      clearTimeout(timeoutId!);
    }
  }

  private async runAnalysis(mediaBuffer: Buffer, userId: string, mediaUri: string, flags: string[]): Promise<AnomalyResult> {
    // 1. Perceptual Hash (pHash) Duplicate Detection
    // In MVP, we use URI-based pHash if buffer analysis fails or for simplicity.
    // For TKT-P0-002, we rely on ProofsController passing the frameHash.
    // Here we focus on EXIF and metadata integrity.

    // 2. EXIF Software Check (Edit Detection)
    const softwareFlag = await this.checkExifSoftware(mediaBuffer);
    if (softwareFlag) {
      flags.push('SOFTWARE_MANIPULATION_DETECTED');
    }

    // 3. EXIF Timestamp Discrepancy
    const timestampFlag = await this.checkExifTimestamp(mediaBuffer);
    if (timestampFlag) {
      flags.push('EXIF_TIMESTAMP_DISCREPANCY');
    }

    // 4. Missing Native Metadata
    const metadata = await sharp(mediaBuffer).metadata();
    if (!metadata.exif && !metadata.iptc && !metadata.xmp) {
      flags.push('STRIPPED_METADATA');
    }

    return { rejected: false, flags };
  }

  async checkExifSoftware(mediaBuffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(mediaBuffer).metadata();
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

  async checkExifTimestamp(mediaBuffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(mediaBuffer).metadata();
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
