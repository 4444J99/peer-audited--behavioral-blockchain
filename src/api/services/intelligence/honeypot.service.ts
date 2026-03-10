import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import { FuryRouterService } from '../fury-router/fury-router.service';
import { TruthLogService } from '../ledger/truth-log.service';

/**
 * HoneypotService — Cron-based synthetic proof injector for Fury accuracy grading.
 *
 * Periodically creates "known-fail" proofs and injects them into the Fury Router
 * queue as normal jobs. When consensus resolves on a honeypot proof:
 *   - Furies who correctly voted FAIL receive an integrity boost (+5)
 *   - Furies who incorrectly voted PASS receive an integrity penalty (-5)
 *
 * This is the "trust but verify" mechanism that keeps the adversarial network honest.
 */
@Injectable()
export class HoneypotService {
  private readonly logger = new Logger(HoneypotService.name);

  /** Integrity score bonus for correctly identifying a honeypot */
  private static readonly HONEYPOT_CORRECT_BONUS = 5;

  /** Integrity score penalty for missing a honeypot */
  private static readonly HONEYPOT_MISS_PENALTY = 5;

  /** Minimum number of active Furies required before injecting */
  private static readonly MIN_FURIES_FOR_INJECTION = 3;

  /** Integrity score threshold below which a Fury is shadow-banned */
  private static readonly SHADOW_BAN_THRESHOLD = 20;

  constructor(
    private readonly pool: Pool,
    private readonly furyRouter: FuryRouterService,
    private readonly truthLog: TruthLogService,
  ) {}

  /**
   * Calculate probability of injection based on recent audit volume.
   * Theorem 7: Probabilistic detection maintains adversarial equilibrium.
   */
  private async shouldInject(): Promise<boolean> {
    const recentAudits = await this.pool.query(
      `SELECT COUNT(*) as count FROM fury_assignments 
       WHERE assigned_at > NOW() - INTERVAL '1 hour'`,
    );
    const volume = parseInt(recentAudits.rows[0].count);
    // Base 10% chance, scales with volume to maintain density
    const probability = Math.min(0.5, 0.1 + (volume / 100));
    return Math.random() < probability;
  }

  /**
   * Inject a honeypot proof periodically if conditions are met.
   * Theorem 7 Convergence: Uses dynamic probability to ensure coverage without predictability.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async injectHoneypot(): Promise<void> {
    try {
      if (!(await this.shouldInject())) {
        this.logger.debug('Skipping honeypot: probability check failed');
        return;
      }

      // Check if there are enough active Furies above shadow-ban threshold
      const furyCount = await this.pool.query(
        `SELECT COUNT(*) as count FROM users
         WHERE status = 'ACTIVE'
           AND role IN ('USER', 'FURY', 'ADMIN')
           AND integrity_score >= $1`,
        [HoneypotService.SHADOW_BAN_THRESHOLD],
      );


      const activeFuries = Number(furyCount.rows[0].count);
      if (activeFuries < HoneypotService.MIN_FURIES_FOR_INJECTION) {
        this.logger.debug(
          `Skipping honeypot injection: only ${activeFuries} active Furies (need ${HoneypotService.MIN_FURIES_FOR_INJECTION})`,
        );
        return;
      }

      // Find a random active contract to host the synthetic proof
      const contractResult = await this.pool.query(
        `SELECT id, user_id FROM contracts
         WHERE status = 'ACTIVE'
         ORDER BY RANDOM()
         LIMIT 1`,
      );

      if (contractResult.rows.length === 0) {
        this.logger.debug('Skipping honeypot injection: no active contracts found');
        return;
      }

      const hostContract = contractResult.rows[0];

      // Create the synthetic honeypot proof
      const proofResult = await this.pool.query(
        `INSERT INTO proofs (
           contract_id, user_id, status, content_type, description,
           media_uri, is_honeypot, honeypot_expected_verdict, submitted_at, uploaded_at
         )
         VALUES ($1, $2, 'PENDING_REVIEW', 'video/mp4', 'Compliance proof — automated verification',
                 $3, true, 'FAIL', NOW(), NOW())
         RETURNING id`,
        [
          hostContract.id,
          hostContract.user_id,
          `honeypots/synthetic/${Date.now()}.mp4`,
        ],
      );

      const honeypotProofId = proofResult.rows[0].id;

      // Route to Furies — they see this as a normal proof
      const jobId = await this.furyRouter.routeProof(
        honeypotProofId,
        hostContract.user_id,
        3,
      );

      await this.truthLog.appendEvent('HONEYPOT_INJECTED', {
        proofId: honeypotProofId,
        hostContractId: hostContract.id,
        furyRouteJobId: jobId,
        expectedVerdict: 'FAIL',
      });

      this.logger.log(
        `Honeypot proof ${honeypotProofId} injected and routed (jobId: ${jobId})`,
      );
    } catch (err) {
      this.logger.error(`Honeypot injection failed: ${(err as Error).message}`);
    }
  }

  /**
   * Grade Fury performance on a resolved honeypot proof.
   * Called by the ConsensusEngine after consensus is reached on a honeypot.
   */
  async gradeHoneypotPerformance(proofId: string, flaggedFuries: string[]): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get all Fury assignments for this proof
      const assignments = await client.query(
        `SELECT fury_user_id, verdict FROM fury_assignments
         WHERE proof_id = $1 AND verdict IS NOT NULL`,
        [proofId],
      );

      for (const assignment of assignments.rows) {
        const isCorrect = assignment.verdict === 'FAIL'; // known-fail → FAIL is correct
        const delta = isCorrect
          ? HoneypotService.HONEYPOT_CORRECT_BONUS
          : -HoneypotService.HONEYPOT_MISS_PENALTY;

        // Adjust integrity score (clamped to 0–100)
        const updateRes = await client.query(
          `UPDATE users
           SET integrity_score = GREATEST(0, LEAST(100, integrity_score + $1))
           WHERE id = $2
           RETURNING integrity_score`,
          [delta, assignment.fury_user_id],
        );

        const newScore = updateRes.rows[0].integrity_score;
        if (newScore < HoneypotService.SHADOW_BAN_THRESHOLD) {
          this.logger.warn(
            `Fury ${assignment.fury_user_id} SHADOW-BANNED (Score: ${newScore})`,
          );
          
          // Theorem 7: Formally update status to SHADOW_BANNED if below threshold
          await client.query(
            `UPDATE users SET status = 'SHADOW_BANNED' WHERE id = $1`,
            [assignment.fury_user_id],
          );
        }

        this.logger.log(
          `Fury ${assignment.fury_user_id}: honeypot verdict=${assignment.verdict}, ` +
          `correct=${isCorrect}, integrity_delta=${delta}, new_score=${newScore}`,
        );
      }


      await client.query('COMMIT');

      await this.truthLog.appendEvent('HONEYPOT_GRADED', {
        proofId,
        totalReviewers: assignments.rows.length,
        flaggedFuries,
        correctCount: assignments.rows.filter((a: any) => a.verdict === 'FAIL').length,
        incorrectCount: flaggedFuries.length,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.error(`Honeypot grading failed for proof ${proofId}: ${(err as Error).message}`);
      throw err;
    } finally {
      client.release();
    }
  }
}
