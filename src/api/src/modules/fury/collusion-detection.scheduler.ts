import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  CollusionDetectionService,
  CollusionRing,
} from '../../../services/security/collusion-detection.service';

/**
 * The only thing that runs the collusion engine.
 *
 * `CollusionDetectionService` is pairwise-correlation analysis over the whole
 * recent review history — there is no single request that can naturally trigger
 * it, because no one reviewer's verdict reveals a ring. Before this sweep the
 * engine had no caller at all outside its own spec: rings were detectable in
 * principle and detected never in practice.
 *
 * The sweep opens PENDING_REVIEW cases; it never applies a penalty. Confirmation
 * (and therefore the REP_BURN / stake slash) stays with an admin via
 * `EnforcementService.confirmCase`, which is the same posture honeypot failures
 * already have — a correlation score is suggestive, not conclusive.
 */
@Injectable()
export class CollusionDetectionScheduler {
  private readonly logger = new Logger(CollusionDetectionScheduler.name);

  /**
   * Lookback deliberately wider than the cadence: a ring that votes once per day
   * would slip through a 6-hour window. Re-detection of an already-filed ring is
   * absorbed by `sanctionRing`'s per-reviewer idempotency guard.
   */
  private static readonly WINDOW_HOURS = 24;

  /** A ring needs corroboration from more than one signal family to be filed. */
  private static readonly MIN_SIGNALS = 2;

  constructor(private readonly collusion: CollusionDetectionService) {}

  @Cron('0 20 */6 * * *') // every 6 hours, offset off the hour to miss the other sweeps
  async sweepForCollusionRings(): Promise<void> {
    let rings: CollusionRing[];
    try {
      rings = await this.collusion.analyzeWindow(
        CollusionDetectionScheduler.WINDOW_HOURS,
        CollusionDetectionScheduler.MIN_SIGNALS,
      );
    } catch (error) {
      this.logger.error(
        `Collusion sweep: analysis failed: ${error instanceof Error ? error.message : error}`,
      );
      return;
    }

    if (rings.length === 0) return;

    // MONITOR rings are below the investigation threshold — recorded in the log,
    // not filed as cases, so the admin queue stays a queue of real suspicions.
    const actionable = rings.filter((r) => r.recommendedAction !== 'MONITOR');
    const monitored = rings.length - actionable.length;

    let casesOpened = 0;
    let ringsFiled = 0;
    for (const ring of actionable) {
      try {
        const caseIds = await this.collusion.sanctionRing(ring);
        if (caseIds.length > 0) {
          ringsFiled++;
          casesOpened += caseIds.length;
        }
      } catch (error) {
        // One unfilable ring must not strand the rest of the sweep.
        this.logger.error(
          `Collusion sweep: failed to file ring ${ring.ringId}: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    }

    this.logger.warn(
      `Collusion sweep: ${rings.length} ring(s) detected over ${CollusionDetectionScheduler.WINDOW_HOURS}h ` +
        `(${monitored} below threshold), ${ringsFiled} filed, ${casesOpened} enforcement case(s) opened`,
    );
  }
}
