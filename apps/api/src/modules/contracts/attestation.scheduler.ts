import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import { ContractsService } from './contracts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NOCONTACT_MISS_STRIKE_THRESHOLD } from '../../../../shared/libs/behavioral-logic';

@Injectable()
export class AttestationScheduler {
  private readonly logger = new Logger(AttestationScheduler.name);

  constructor(
    private readonly pool: Pool,
    private readonly contractsService: ContractsService,
    @Optional() @Inject(NotificationsService)
    private readonly notifications?: NotificationsService,
  ) {}

  /**
   * Hourly: Create pending attestation rows for active RECOVERY contracts
   * where today's attestation doesn't exist yet.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async createDailyAttestations(): Promise<void> {
    const result = await this.pool.query(
      `INSERT INTO attestations (contract_id, user_id, attestation_date, status)
       SELECT c.id, c.user_id, CURRENT_DATE, 'PENDING'
       FROM contracts c
       WHERE c.status = 'ACTIVE'
         AND c.oath_category LIKE 'RECOVERY_%'
         AND NOT EXISTS (
           SELECT 1 FROM attestations a
           WHERE a.contract_id = c.id AND a.attestation_date = CURRENT_DATE
         )
       ON CONFLICT (contract_id, attestation_date) DO NOTHING
       RETURNING id`,
    );

    if (result.rows.length > 0) {
      this.logger.log(`Created ${result.rows.length} pending attestation(s) for today.`);
    }
  }

  /**
   * Midnight: Mark yesterday's PENDING attestations as MISSED,
   * apply strikes, and auto-FAIL contracts that hit the threshold.
   */
  @Cron('0 0 * * *')
  async processExpiredAttestations(): Promise<void> {
    // 1. Find all PENDING attestations from yesterday
    const missed = await this.pool.query(
      `UPDATE attestations
       SET status = 'MISSED'
       WHERE status = 'PENDING'
         AND attestation_date < CURRENT_DATE
       RETURNING contract_id`,
    );

    if (missed.rows.length === 0) return;

    this.logger.log(`Marking ${missed.rows.length} attestation(s) as MISSED.`);

    // 2. Apply strikes and check for auto-FAIL.
    //    Each MISSED attestation is a distinct missed obligation, so count how
    //    many days were missed per contract rather than collapsing them to one
    //    strike via a Set. (Normally the midnight cron processes a single
    //    yesterday, but a catch-up run after downtime can surface several days.)
    const missedCountByContract = new Map<string, number>();
    for (const r of missed.rows) {
      missedCountByContract.set(r.contract_id, (missedCountByContract.get(r.contract_id) || 0) + 1);
    }

    for (const [contractId, missedCount] of missedCountByContract) {
      try {
        // LC11: A multi-day catch-up run (e.g. after downtime) must NOT collapse
        // several missed days into a single +N strike bump that jumps straight
        // past the RAIN intervention threshold to auto-FAIL with one notification.
        // The intended escalation is per-miss: each missed day adds one strike and,
        // while still BELOW the threshold, fires a RAIN Mindfulness intercession —
        // the chance for the user to course-correct before the contract fails.
        // We therefore replay the misses one at a time, applying exactly the
        // per-day escalation the downtime skipped, and stop as soon as the contract
        // hits the threshold (auto-FAIL) so we neither over-penalize past the
        // threshold nor skip the pre-threshold interventions.
        for (let i = 0; i < missedCount; i++) {
          // Add a single strike. The `status = 'ACTIVE'` guard ensures an
          // already-resolved contract is never re-struck on a subsequent run, and
          // also stops this loop once the auto-FAIL below has resolved the contract.
          const updated = await this.pool.query(
            `UPDATE contracts SET strikes = strikes + 1 WHERE id = $1 AND status = 'ACTIVE' RETURNING user_id, strikes`,
            [contractId],
          );

          if (updated.rows.length === 0) {
            // Contract is no longer ACTIVE (already resolved this run, or by another
            // path) — stop applying further strikes for it.
            break;
          }

          const { user_id, strikes } = updated.rows[0];

          if (strikes >= NOCONTACT_MISS_STRIKE_THRESHOLD) {
            this.logger.log(`Contract ${contractId} hit ${NOCONTACT_MISS_STRIKE_THRESHOLD} missed attestations — auto-FAIL.`);
            // resolveContract is idempotent (it re-checks and locks the status),
            // so even if this throws transiently and a later run retries, it will
            // not double-settle: the conditional status claim only succeeds once.
            await this.contractsService.resolveContract(contractId, 'FAILED');
            // Threshold reached — remaining missed days for this contract are moot
            // (it is now resolved); stop here rather than over-counting strikes.
            break;
          }

          // F-AEGIS-08: Below threshold — fire the RAIN Mindfulness intercession for
          // THIS miss. Doing it per-step means a catch-up still delivers the
          // pre-threshold interventions instead of a single batched notification.
          if (this.notifications) {
            await this.notifications.createRainNotification(user_id, contractId, 'MISSED_ATTESTATION');
          }
        }
      } catch (err) {
        this.logger.error(
          `Failed to process missed attestation for contract ${contractId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}
