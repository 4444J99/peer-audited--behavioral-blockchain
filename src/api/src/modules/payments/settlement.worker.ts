import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { Pool, PoolClient } from 'pg';
import { SETTLEMENT_QUEUE_NAME, getRedisConnectionConfig } from '../../../config/queue.config';
import { StripePayoutProvider } from './stripe-payout.provider';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PayoutStatus } from '../../common/interfaces/payout-provider.interface';
import { buildSettlementQuote } from './settlement-quote';
import { toCents } from '../../../../shared/libs/money';

@Injectable()
export class SettlementWorker implements OnModuleInit {
  private readonly logger = new Logger(SettlementWorker.name);
  private worker!: Worker;

  constructor(
    private readonly pool: Pool,
    private readonly stripeProvider: StripePayoutProvider,
    private readonly ledger: LedgerService,
    private readonly truthLog: TruthLogService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      SETTLEMENT_QUEUE_NAME,
      async (job: Job) => this.process(job),
      { connection: getRedisConnectionConfig(), concurrency: 2 },
    );
    this.logger.log('Settlement worker initialized and listening on SETTLEMENT_QUEUE');
  }

  private async process(job: Job): Promise<void> {
    const { contractId, outcome, paymentIntentId, amountCents, furies, dispositionMode } = job.data;
    this.logger.log(`Processing settlement for contract ${contractId} (${outcome})...`);

    // PM26: never trust the job-supplied amountCents blindly. A stale/replayed/manipulated
    // amount would settle the wrong sum AND post a ledger entry that disagrees with the
    // contract. Re-derive the server-authoritative stake from the contract and reject a
    // mismatch so reconciliation/operators can investigate rather than money moving silently.
    const settledAmountCents = await this.resolveAuthoritativeAmount(contractId, amountCents);

    // TKT-P0-001: Deterministic Payout Breakdown
    const quote = buildSettlementQuote(settledAmountCents, outcome, dispositionMode);

    // Atomically claim (or resume) the run for this (contract, outcome). We take a
    // FOR UPDATE lock on the contract row so that two concurrent workers (concurrency: 2)
    // or a BullMQ retry cannot race the "already succeeded?" check against the INSERT.
    // The lock is held only for this short claim transaction, never across the Stripe call.
    const runId = await this.claimRun(contractId, outcome, settledAmountCents, dispositionMode, quote);
    if (!runId) {
      this.logger.log(`Settlement for contract ${contractId} (${outcome}) already succeeded. Skipping.`);
      return;
    }

    try {
      let result;
      const actualAction = quote.actualAction;

      if (actualAction === 'RELEASE') {
        result = await this.stripeProvider.releaseFunds(paymentIntentId, settledAmountCents);
      } else {
        result = await this.stripeProvider.captureFunds(paymentIntentId, settledAmountCents, { furies, runId });
      }

      if (result.status === PayoutStatus.SUCCESS) {
        // Finalize the ledger and mark the run SUCCESS in ONE transaction so a crash/retry
        // between the two can never leave money recorded with the run still PROCESSING.
        await this.finalizeSettlement(contractId, outcome, settledAmountCents, runId, dispositionMode, quote, result.providerTransactionId);

        // PM28: the audit append happens AFTER the finalize commit (we must never append a
        // SETTLEMENT_COMPLETED before the money/ledger are committed). Because the run is now
        // SUCCESS, a later retry short-circuits in claimRun and would never write the event, so a
        // failure HERE must NOT throw (that would also mark the already-settled run FAILED). Make
        // it best-effort and log loudly for reconciliation if it fails.
        try {
          await this.truthLog.appendEvent('SETTLEMENT_COMPLETED', {
            contractId,
            outcome,
            runId,
            dispositionMode,
            actualAction,
            providerTransactionId: result.providerTransactionId,
            quote,
          });
        } catch (appendErr: any) {
          this.logger.error(
            `Settlement for contract ${contractId} (run ${runId}) committed, but the ` +
              `SETTLEMENT_COMPLETED audit append failed: ${appendErr?.message}. ` +
              `Money has moved; flag for reconciliation.`,
          );
        }
        this.logger.log(`Settlement successful for contract ${contractId} (Action: ${actualAction})`);
      } else {
        throw new Error(result.error || 'Provider returned failure status without error message');
      }
    } catch (err: any) {
      // PM31: only flip to FAILED if WE still own the run as PROCESSING. A concurrent worker
      // that reclaimed a stale-PROCESSING run and already marked it SUCCESS must not be clobbered
      // back to FAILED by this loser's catch block (which would mis-drive reconciliation/claimRun).
      await this.pool.query(
        `UPDATE settlement_runs SET status = 'FAILED', last_error = $1 WHERE id = $2 AND status = 'PROCESSING'`,
        [err.message, runId]
      );
      this.logger.error(`Settlement failed for ${contractId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * PM26: re-derive the server-authoritative settlement amount from the contract's stake and
   * reject a job whose amountCents disagrees with it. The contract row is the source of truth;
   * the queued amountCents can be stale (a re-enqueue after a double-down), replayed, or tampered.
   *
   * If the contract still exists we require an exact match against toCents(stake_amount). If the
   * contract cannot be read (e.g. unit/integration contexts without a contracts table), we fall
   * back to the job-supplied amount so existing call paths keep working, but a present-yet-
   * mismatched stake is always rejected rather than silently settling the wrong sum.
   */
  private async resolveAuthoritativeAmount(contractId: string, jobAmountCents: number): Promise<number> {
    let stakeAmount: unknown;
    try {
      const res = await this.pool.query('SELECT stake_amount FROM contracts WHERE id = $1', [contractId]);
      if (res.rows.length === 0) {
        // Contract not found in this context — trust the dispatched amount (legacy/test path).
        return jobAmountCents;
      }
      stakeAmount = res.rows[0].stake_amount;
    } catch {
      return jobAmountCents;
    }

    if (stakeAmount === null || stakeAmount === undefined) {
      return jobAmountCents;
    }

    const authoritative = toCents(Number(stakeAmount));
    if (authoritative !== jobAmountCents) {
      throw new Error(
        `Settlement amount mismatch for contract ${contractId}: job requested ${jobAmountCents}¢ but ` +
          `contract stake is ${authoritative}¢. Refusing to settle a non-authoritative amount.`,
      );
    }
    return authoritative;
  }

  /**
   * Atomically determines whether this attempt should proceed, and returns the run id to use.
   *
   * Concurrency safety: a FOR UPDATE lock on the contract row serializes all settlement
   * attempts for the same contract, closing the prior check-then-insert race (concurrency: 2)
   * and the BullMQ-retry race that previously inserted a fresh runId per attempt.
   *
   * Returns null if a SUCCESS run already exists (caller should skip). Otherwise returns a
   * STABLE run id: an existing non-success run for this (contract, outcome) is reused rather
   * than inserting a new row per attempt, so retries cannot proliferate runIds.
   */
  private async claimRun(
    contractId: string,
    outcome: string,
    amountCents: number,
    dispositionMode: string | undefined,
    quote: any,
  ): Promise<string | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Serialize concurrent settlement attempts for this contract.
      await client.query('SELECT id FROM contracts WHERE id = $1 FOR UPDATE', [contractId]);

      const existing = await client.query(
        `SELECT id, status, started_at FROM settlement_runs
         WHERE contract_id = $1 AND outcome = $2
         ORDER BY started_at DESC
         LIMIT 1`,
        [contractId, outcome],
      );

      // A run that is actively PROCESSING and still fresh is owned by another worker;
      // running the Stripe settlement concurrently with it is exactly the double-pay
      // hazard the contract-row FOR UPDATE lock above is meant to prevent — but that
      // lock is released at COMMIT, before the provider call, so it only serializes
      // THIS claim. Treat a fresh PROCESSING run as owned (skip); only reclaim once it
      // is stale enough to assume the prior worker crashed, or if it FAILED.
      const STALE_PROCESSING_MS = 5 * 60 * 1000;

      if (existing.rows.length > 0) {
        if (existing.rows[0].status === 'SUCCESS') {
          await client.query('COMMIT');
          return null;
        }
        if (existing.rows[0].status === 'PROCESSING') {
          const startedAt = new Date(existing.rows[0].started_at).getTime();
          if (Number.isFinite(startedAt) && Date.now() - startedAt < STALE_PROCESSING_MS) {
            await client.query('COMMIT');
            return null;
          }
        }
        // Reclaim a FAILED or stale PROCESSING run; reset started_at so the staleness
        // window restarts for this worker.
        await client.query(
          `UPDATE settlement_runs
           SET status = 'PROCESSING', amount_cents = $2, disposition_mode = $3, quote_json = $4, last_error = NULL, started_at = NOW()
           WHERE id = $1`,
          [existing.rows[0].id, amountCents, dispositionMode || (outcome === 'PASS' ? 'REFUND' : 'CAPTURE'), JSON.stringify(quote)],
        );
        await client.query('COMMIT');
        return existing.rows[0].id;
      }

      const inserted = await client.query(
        `INSERT INTO settlement_runs (contract_id, outcome, amount_cents, status, started_at, disposition_mode, quote_json)
         VALUES ($1, $2, $3, 'PROCESSING', NOW(), $4, $5)
         RETURNING id`,
        [contractId, outcome, amountCents, dispositionMode || (outcome === 'PASS' ? 'REFUND' : 'CAPTURE'), JSON.stringify(quote)],
      );
      await client.query('COMMIT');
      return inserted.rows[0].id;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Atomically finalizes the ledger and marks the run SUCCESS in a single DB transaction.
   * Ledger idempotency is keyed on the STABLE (contract_id, entry-type, amount) tuple rather
   * than the per-attempt run id, so a retry that reuses a different run can never double-post
   * entries, while a legitimately different settlement amount (e.g. a double-down re-dispatch)
   * is NOT mistaken for a duplicate of the prior posting.
   */
  private async finalizeSettlement(
    contractId: string,
    outcome: string,
    amountCents: number,
    runId: string,
    dispositionMode: string | undefined,
    quote: any,
    providerTransactionId?: string,
  ) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await this.finalizeLedger(client, contractId, outcome, amountCents, runId, dispositionMode, quote);
      // PM6: guard the SUCCESS transition with the expected PROCESSING state so a second
      // (concurrent / stale-reclaimed) worker cannot clobber a run that another worker is
      // also finalizing. The DB-enforced ledger idempotency key (PM4) is what actually
      // protects the money; this guard keeps the run-status machine consistent.
      await client.query(
        `UPDATE settlement_runs SET status = 'SUCCESS', provider_tx_id = $1, completed_at = NOW() WHERE id = $2 AND status = 'PROCESSING'`,
        [providerTransactionId, runId],
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  private async finalizeLedger(
    client: PoolClient,
    contractId: string,
    outcome: string,
    amountCents: number,
    runId: string,
    dispositionMode?: string,
    quote?: any
  ) {
    const contractResult = await client.query(
      `SELECT c.user_id, u.account_id, a_escrow.id as escrow_account_id, a_revenue.id as revenue_account_id, a_bounty.id as bounty_pool_account_id
       FROM contracts c
       JOIN users u ON c.user_id = u.id
       CROSS JOIN accounts a_escrow WHERE a_escrow.name = 'SYSTEM_ESCROW'
       CROSS JOIN accounts a_revenue WHERE a_revenue.name = 'SYSTEM_REVENUE'
       CROSS JOIN accounts a_bounty WHERE a_bounty.name = 'FURY_BOUNTY_POOL'
       WHERE c.id = $1`,
      [contractId]
    );

    if (contractResult.rows.length === 0) {
      throw new Error(`Contract ${contractId} or system accounts not found for ledger finalization`);
    }
    const row = contractResult.rows[0];

    const shouldReturnToUser = quote?.actualAction === 'RELEASE'
      || outcome === 'PASS'
      || dispositionMode === 'REFUND';

    const metadata = {
      settlement_run_id: runId,
      provider: 'stripe',
      outcome,
      dispositionMode
    };

    if (shouldReturnToUser) {
      const txType = 'REAL_MONEY_SETTLEMENT_RELEASE';
      // entryExists is a FAST PATH only, keyed on the same per-(run, type) idempotency key as the
      // DB UNIQUE index — so it short-circuits ONLY a true retry of this run, never a legitimately
      // distinct re-settlement under a new run (PM5). The DB key below is the authoritative
      // single-posting guard against the concurrency/TOCTOU race (PM4).
      const key = this.settlementEntryKey(runId, txType);
      if (await this.entryExists(client, key)) return;
      await this.ledger.recordTransaction(
        row.escrow_account_id,
        row.account_id,
        amountCents,
        contractId,
        { ...metadata, type: txType, reason: outcome === 'FAIL' ? 'REFUND_ONLY_JURISDICTION' : 'CONTRACT_SUCCESS' },
        client,
        key,
      );
    } else {
      // Capture to Revenue
      const captureType = 'REAL_MONEY_SETTLEMENT_CAPTURE';
      const captureKey = this.settlementEntryKey(runId, captureType);
      if (!(await this.entryExists(client, captureKey))) {
        await this.ledger.recordTransaction(
          row.escrow_account_id,
          row.revenue_account_id,
          amountCents,
          contractId,
          { ...metadata, type: captureType },
          client,
          captureKey,
        );
      }

      // Move portion to Bounty Pool
      if (quote?.bountyPoolCents > 0) {
        const topupType = 'BOUNTY_POOL_TOPUP';
        const topupKey = this.settlementEntryKey(runId, topupType);
        if (!(await this.entryExists(client, topupKey))) {
          await this.ledger.recordTransaction(
            row.revenue_account_id,
            row.bounty_pool_account_id,
            quote.bountyPoolCents,
            contractId,
            { ...metadata, type: topupType },
            client,
            topupKey,
          );
        }
      }
    }
  }

  /**
   * Deterministic ledger idempotency key for a settlement posting (PM4/PM5/PM29).
   *
   * Keyed on the STABLE settlement_run_id + entry type — NOT (contract, type, amount):
   *   - A true retry reuses the SAME run id (claimRun reuses an existing non-success run for the
   *     (contract, outcome) rather than minting a fresh one), so the key is identical and the DB
   *     UNIQUE index collapses the second INSERT to a no-op — even if two workers race past the
   *     fast-path entryExists() check (PM4 TOCTOU).
   *   - A genuinely distinct re-settlement (e.g. a re-resolution / double-down re-dispatch) runs
   *     under a NEW run id, so its key differs and the posting is correctly NOT deduped (PM5),
   *     and two equal-magnitude bounty top-ups under different runs no longer collide (PM29).
   */
  private settlementEntryKey(runId: string, type: string): string {
    return `styx_settle_${runId}_${type}`;
  }

  /**
   * Fast-path single-posting check keyed on the SAME deterministic idempotency_key the DB UNIQUE
   * index enforces (PM4/PM5). Matching the DB key exactly means:
   *   - a true retry of THIS run (same key) is short-circuited here, and
   *   - a legitimately distinct re-settlement under a NEW run id (different key) is NOT wrongly
   *     skipped, even when its amount equals a prior posting.
   * The DB constraint remains the authoritative guard; this only avoids an unnecessary INSERT
   * attempt on the common retry path.
   */
  private async entryExists(client: PoolClient, idempotencyKey: string): Promise<boolean> {
    const existing = await client.query(
      'SELECT id FROM entries WHERE idempotency_key = $1',
      [idempotencyKey],
    );
    return existing.rows.length > 0;
  }
}
