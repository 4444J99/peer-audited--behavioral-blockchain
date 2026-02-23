import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';

@Injectable()
export class UsersScheduler {
  private readonly logger = new Logger(UsersScheduler.name);

  constructor(private readonly pool: Pool) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyDecay(): Promise<void> {
    const result = await this.pool.query(`
      UPDATE users SET integrity_score = GREATEST(0, integrity_score - 1)
      WHERE id NOT IN (
        SELECT DISTINCT user_id FROM contracts
        WHERE created_at > NOW() - INTERVAL '30 days'
      )
      AND integrity_score > 0
      AND status = 'ACTIVE'
    `);

    this.logger.log(`Monthly integrity decay applied to ${result.rowCount} inactive user(s)`);
  }
}
