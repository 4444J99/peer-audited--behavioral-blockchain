import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Pool } from 'pg';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import {
  ESCROW_PROVIDER,
  EscrowProvider,
} from '../../common/interfaces/payout-provider.interface';

const RECONCILE_MAX_ATTEMPTS = 5;
const RECONCILE_BATCH_LIMIT = 100;

@Injectable()
export class AdminScheduler {
  private readonly logger = new Logger(AdminScheduler.name);

  constructor(
    private readonly pool: Pool,
    @Inject(ESCROW_PROVIDER) private readonly escrow: EscrowProvider,
    private readonly truthLog: TruthLogService,
  ) {}

  @Cron('0 3 * * *') // 3 AM daily
  async verifyHashChain(): Promise<void> {
    const result = await this.truthLog.verifyChain();
    if (!result.valid) {
      this.logger.error(
        `HASH CHAIN CORRUPTION: ${result.corrupted.length} corrupted entries`,
      );
    } else {
      this.logger.log(
        `Hash chain verified: ${result.checked} events, all valid`,
      );
    }
  }

  /**
   * Reclaim contracts stuck in RECONCILE_REQUIRED.
   *
   * Every 15 minutes, oldest first, capped at {@link RECONCILE_MAX_ATTEMPTS} per
   * contract. Per contract:
   *
   *   - no payment intent at all   -> STAKE_FAILED  — the authorization never
   *     happened (B2 dead-letter); no money moved, nothing to refund or capture.
   *   - hold HELD                  -> ACTIVE        — the authorization is live
   *     but a later finalize step failed (phase-B / side-effect compensation).
   *     Complete the activation.
   *   - hold CAPTURED / RELEASED   -> RECONCILED    — the money already moved
   *     (a settlement or compensation settled the hold). Terminal.
   *
   * Contracts that exhaust their attempts while still stuck are left in
   * RECONCILE_REQUIRED for an operator — the sweep never silently settles money
   * it cannot account for.
   */
  @Cron('0 */15 * * * *')
  async reconcileStuckContracts(): Promise<void> {
    let target: Array<{
      id: string;
      payment_intent_id: string | null;
      reconcile_attempts: string | number;
    }>;
    try {
      const result = await this.pool.query(
        `SELECT id, payment_intent_id, reconcile_attempts
         FROM contracts
         WHERE status = 'RECONCILE_REQUIRED'
           AND reconcile_attempts < $1
         ORDER BY updated_at ASC
         LIMIT $2`,
        [RECONCILE_MAX_ATTEMPTS, RECONCILE_BATCH_LIMIT],
      );
      target = result.rows;
    } catch (err) {
      this.logger.error(
        `Reconcile sweep: failed to load stuck contracts: ${err instanceof Error ? err.message : err}`,
      );
      return;
    }

    if (target.length === 0) return;

    let reclaimed = 0;
    let exhausted = 0;
    for (const contract of target) {
      const { id: contractId, payment_intent_id } = contract;
      const attempts = Number(contract.reconcile_attempts);
      const nextAttempts = attempts + 1;

      try {
        if (!payment_intent_id) {
          // The authorization never happened; no money moved.
          await this.pool.query(
            `UPDATE contracts
             SET status = 'STAKE_FAILED', reconcile_attempts = $2
             WHERE id = $1`,
            [contractId, nextAttempts],
          );
          await this.truthLog.appendEvent('CONTRACT_RECONCILED_STAKE_FAILED', {
            contractId,
            attempts: nextAttempts,
            reason: 'no_payment_intent',
          });
          reclaimed++;
          continue;
        }

        let hold;
        try {
          hold = await this.escrow.retrieveHold(payment_intent_id);
        } catch (retrieveErr) {
          this.logger.error(
            `Reconcile sweep: cannot resolve hold ${payment_intent_id} for contract ${contractId}: ${
              retrieveErr instanceof Error ? retrieveErr.message : retrieveErr
            }`,
          );
          // Unresolvable hold under the ceiling: bump attempts and let a later
          // sweep (or an operator) look again.
          await this.pool.query(
            `UPDATE contracts SET reconcile_attempts = $2 WHERE id = $1`,
            [contractId, nextAttempts],
          );
          if (nextAttempts >= RECONCILE_MAX_ATTEMPTS) exhausted++;
          continue;
        }

        if (hold.status === 'HELD') {
          // The authorization is live but activation never completed. Complete it.
          await this.pool.query(
            `UPDATE contracts SET status = 'ACTIVE', reconcile_attempts = $2 WHERE id = $1`,
            [contractId, nextAttempts],
          );
          await this.truthLog.appendEvent('CONTRACT_RECONCILED_ACTIVATED', {
            contractId,
            paymentIntentId: payment_intent_id,
            attempts: nextAttempts,
          });
          reclaimed++;
          continue;
        }

        // CAPTURED or RELEASED: the money already moved. Terminal.
        await this.pool.query(
          `UPDATE contracts SET status = 'RECONCILED', reconcile_attempts = $2 WHERE id = $1`,
          [contractId, nextAttempts],
        );
        await this.truthLog.appendEvent('CONTRACT_RECONCILED', {
          contractId,
          paymentIntentId: payment_intent_id,
          holdStatus: hold.status,
          attempts: nextAttempts,
        });
        reclaimed++;
      } catch (err) {
        this.logger.error(
          `Reconcile sweep: failed to reconcile contract ${contractId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    this.logger.log(
      `Reconcile sweep: ${reclaimed} contracts reclaimed, ${exhausted} exhausted their attempt ceiling`,
    );
  }
}
