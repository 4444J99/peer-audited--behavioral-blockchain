import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { inTransaction } from '../../../services/ledger/transaction';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { captureFinancialAlert } from '../../common/monitoring/sentry';

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

    await inTransaction(this.pool, async (client) => {
      await client.query(
        `UPDATE users SET status = 'QUARANTINED' WHERE account_id = $1`, [accountId],
      );
      // Keep accounts.name (a lookup key) unchanged.
      await client.query(
        `UPDATE accounts SET status = 'QUARANTINED' WHERE id = $1 AND status IS DISTINCT FROM 'QUARANTINED'`,
        [accountId],
      );
      await this.truthLog.appendEvent('LEDGER_QUARANTINE_ACTIVATED', {
        accountId, reason, metadata, severity: 'CRITICAL',
      }, client);
    });
    captureFinancialAlert('LEDGER_QUARANTINE_ACTIVATED', { accountId, reason, metadata });

    this.logger.warn(`Account ${accountId} and associated user have been restricted from all financial operations.`);
  }
}
