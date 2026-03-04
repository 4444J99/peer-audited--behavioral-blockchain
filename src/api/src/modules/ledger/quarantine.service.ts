import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

/**
 * QuarantineService: Automated Ledger Safeguard
 * 
 * If a ledger imbalance or "Phantom Money" is detected, this service
 * immediately locks down the affected accounts to prevent real-world
 * fund leakage.
 */
@Injectable()
export class QuarantineService {
  private readonly logger = new Logger(QuarantineService.name);

  constructor(
    private readonly pool: Pool,
    private readonly truthLog: TruthLogService,
  ) {}

  async activateQuarantine(accountId: string, reason: string, metadata?: Record<string, any>) {
    this.logger.error(`[PHANTOM_MONEY_PROTECTION] Quarantining account ${accountId}. Reason: ${reason}`);

    // 1. Lock the user associated with this account
    await this.pool.query(
      `UPDATE users SET status = 'QUARANTINED' WHERE account_id = $1`,
      [accountId]
    );

    // 2. Log to the Immutable TruthLog
    await this.truthLog.appendEvent('LEDGER_QUARANTINE_ACTIVATED', {
      accountId,
      reason,
      metadata,
      severity: 'CRITICAL',
    });

    // 3. Mark the account itself as restricted in metadata
    await this.pool.query(
      `UPDATE accounts SET name = name || ' [QUARANTINED]' WHERE id = $1 AND name NOT LIKE '%[QUARANTINED]'`,
      [accountId]
    );

    this.logger.warn(`Account ${accountId} and associated user have been restricted from all financial operations.`);
  }
}
