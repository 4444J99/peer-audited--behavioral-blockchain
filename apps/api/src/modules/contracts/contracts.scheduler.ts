import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import { ContractsService } from './contracts.service';

@Injectable()
export class ContractsScheduler {
  private readonly logger = new Logger(ContractsScheduler.name);

  constructor(
    private readonly pool: Pool,
    private readonly contractsService: ContractsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredContracts(): Promise<void> {
    const expired = await this.pool.query(
      `SELECT id FROM contracts WHERE status = 'ACTIVE' AND ends_at < NOW()`,
    );

    if (expired.rows.length === 0) return;

    this.logger.log(`Found ${expired.rows.length} expired contract(s), resolving as FAILED...`);

    for (const row of expired.rows) {
      try {
        await this.contractsService.resolveContract(row.id, 'FAILED');
        this.logger.log(`Expired contract ${row.id} resolved as FAILED`);
      } catch (err) {
        this.logger.error(
          `Failed to resolve expired contract ${row.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  @Cron('*/5 * * * *')
  async retryFailedContractResolutionSideEffects(): Promise<void> {
    const summary = await this.contractsService.sweepFailedContractResolutionSideEffects();

    if (
      summary.staleResetCount === 0 &&
      summary.staleQuarantinedCount === 0 &&
      summary.groupsFound === 0 &&
      summary.groupsRetried === 0 &&
      summary.groupsFailed === 0
    ) {
      return;
    }

    this.logger.log(
      `Settlement outbox sweep: staleReset=${summary.staleResetCount}, staleQuarantined=${summary.staleQuarantinedCount}, groupsFound=${summary.groupsFound}, retried=${summary.groupsRetried}, failed=${summary.groupsFailed}, quarantinedTotal=${summary.quarantinedTotalCount}`,
    );
  }
}
