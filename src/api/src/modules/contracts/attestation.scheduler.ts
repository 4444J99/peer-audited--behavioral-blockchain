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

    // 2. Apply strikes and check for auto-FAIL
    const contractIds = [...new Set(missed.rows.map(r => r.contract_id))];

    for (const contractId of contractIds) {
      try {
        // Increment strike
        const updated = await this.pool.query(
          `UPDATE contracts SET strikes = strikes + 1 WHERE id = $1 AND status = 'ACTIVE' RETURNING user_id, strikes`,
          [contractId],
        );

        if (updated.rows.length > 0) {
          const { user_id, strikes } = updated.rows[0];
          
          // F-AEGIS-08: Trigger RAIN Mindfulness intercession on first and second miss
          if (this.notifications && strikes < NOCONTACT_MISS_STRIKE_THRESHOLD) {
            await this.notifications.createRainNotification(user_id, contractId, 'MISSED_ATTESTATION');
          }

          if (strikes >= NOCONTACT_MISS_STRIKE_THRESHOLD) {
            this.logger.log(`Contract ${contractId} hit ${NOCONTACT_MISS_STRIKE_THRESHOLD} missed attestations — auto-FAIL.`);
            await this.contractsService.resolveContract(contractId, 'FAILED');
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
