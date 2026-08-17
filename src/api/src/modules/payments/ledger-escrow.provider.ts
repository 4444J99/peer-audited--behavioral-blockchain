import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { JurisdictionTier } from '../../../services/geofencing';
import { resolveStakeDisposition } from '../../../services/escrow/disposition';
import {
  EscrowHold,
  EscrowHoldStatus,
  EscrowProvider,
  EscrowRail,
  StakeDisposition,
} from '../../common/interfaces/payout-provider.interface';

const HOLD_TYPE = 'STAKE_HOLD';
const RELEASE_TYPE = 'STAKE_RETURN';
const CAPTURE_TYPE = 'STAKE_CAPTURED';
const TRANSFER_TYPE = 'ESCROW_TRANSFER';

interface LedgerHoldRow {
  id: string;
  debit_account_id: string;
  credit_account_id: string;
  amount: string;
  contract_id: string | null;
  metadata: Record<string, any> | null;
}

/**
 * The ledger as an escrow *entry* rail.
 *
 * A hold here is a real double-entry posting against SYSTEM_ESCROW, not a mock:
 * balances, integrity checks and reconciliation all exercise the same code paths
 * an external rail would — with no outside money attached. `movesRealMoney` is
 * `false` by declaration, so the pilot interlocks in `assertRealMoneyAllowed`
 * never arm on this rail and no configuration mistake can move real money.
 *
 * `EscrowHold.id` is the ledger `entries.id` of the hold posting. Later postings
 * that settle the hold carry `metadata.holdEntryId`, so `retrieveHold` derives
 * the current state from the ledger itself rather than trusting the caller.
 */
@Injectable()
export class LedgerEscrowProvider implements EscrowProvider {
  readonly rail: EscrowRail = 'LEDGER';
  readonly movesRealMoney = false;

  private readonly logger = new Logger(LedgerEscrowProvider.name);

  constructor(
    private readonly ledger: LedgerService,
    private readonly pool: Pool,
  ) {}

  /** The rail-scoped customer handle is the user's ledger account id. */
  async createCustomer(userId: string): Promise<string> {
    const user = await this.pool.query(
      'SELECT id, account_id FROM users WHERE id = $1',
      [userId],
    );
    if (user.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (user.rows[0].account_id) {
      return user.rows[0].account_id as string;
    }

    // Users predating account linking (or a test fixture that skipped it) get an
    // account created on demand, mirroring the registration-time provisioning.
    const account = await this.pool.query(
      `INSERT INTO accounts (name, type) VALUES ($1, 'ASSET') RETURNING id`,
      [`USER_${userId}`],
    );
    const accountId = account.rows[0].id as string;
    await this.pool.query(
      'UPDATE users SET account_id = $1 WHERE id = $2',
      [accountId, userId],
    );
    this.logger.debug(`Created ledger account ${accountId} for user ${userId}`);
    return accountId;
  }

  /**
   * Post the stake hold: user asset → SYSTEM_ESCROW liability.
   *
   * Ledger postings are synchronous, so a successful post IS custody taken —
   * reported HELD, never PENDING. The entry id is the rail-scoped hold id.
   */
  async holdStake(
    customerId: string,
    amountCents: number,
    contractId: string,
    idempotencyKeyOverride?: string,
  ): Promise<EscrowHold> {
    const escrowAccountId = await this.requireSystemAccount('SYSTEM_ESCROW');
    const key =
      idempotencyKeyOverride ??
      `styx_ledger_hold_${contractId}_${randomUUID()}`;
    const entryId = await this.ledger.recordTransaction(
      customerId,
      escrowAccountId,
      amountCents,
      contractId,
      { type: HOLD_TYPE },
      undefined,
      key,
    );
    return {
      id: entryId,
      status: 'HELD',
      amountCents,
      currency: 'usd',
      rail: this.rail,
    };
  }

  /**
   * Release the full authorization: SYSTEM_ESCROW → user asset.
   *
   * Idempotent via `styx_ledger_release_{holdId}`: a retry after a crash collapses
   * to the original posting and returns RELEASED rather than double-refunding.
   */
  async cancelHold(holdId: string): Promise<EscrowHold> {
    const hold = await this.loadHold(holdId);
    const key = `styx_ledger_release_${holdId}`;
    await this.ledger.recordTransaction(
      hold.credit_account_id,
      hold.debit_account_id,
      Number(hold.amount),
      hold.contract_id ?? undefined,
      { type: RELEASE_TYPE, holdEntryId: holdId },
      undefined,
      key,
    );
    return this.toHold(hold, 'RELEASED', Number(hold.amount));
  }

  /**
   * Capture a previously authorized hold, in full or (when partial) in part.
   *
   * A partial capture moves `captureAmountCents` to SYSTEM_REVENUE and releases
   * the remainder back to the user, mirroring Stripe's manual-capture semantics
   * where capturing less than the authorization releases the rest.
   */
  async captureStake(
    holdId: string,
    captureAmountCents?: number,
  ): Promise<EscrowHold> {
    const hold = await this.loadHold(holdId);
    const fullAmount = Number(hold.amount);
    const captureAmount = captureAmountCents ?? fullAmount;
    const revenueAccountId = await this.requireSystemAccount('SYSTEM_REVENUE');
    const captureKey =
      captureAmountCents !== undefined
        ? `styx_ledger_capture_${holdId}_${captureAmountCents}`
        : `styx_ledger_capture_${holdId}_full`;
    await this.ledger.recordTransaction(
      hold.credit_account_id,
      revenueAccountId,
      captureAmount,
      hold.contract_id ?? undefined,
      { type: CAPTURE_TYPE, holdEntryId: holdId, captureAmountCents: captureAmountCents ?? null },
      undefined,
      captureKey,
    );
    if (captureAmount < fullAmount) {
      const remainder = fullAmount - captureAmount;
      const releaseKey = `styx_ledger_release_${holdId}_partial`;
      await this.ledger.recordTransaction(
        hold.credit_account_id,
        hold.debit_account_id,
        remainder,
        hold.contract_id ?? undefined,
        { type: RELEASE_TYPE, holdEntryId: holdId, reason: 'PARTIAL_CAPTURE_REMAINDER' },
        undefined,
        releaseKey,
      );
    }
    return this.toHold(hold, 'CAPTURED', captureAmount);
  }

  /** Derive the current state of a hold from the ledger's own postings. */
  async retrieveHold(holdId: string): Promise<EscrowHold> {
    const hold = await this.loadHold(holdId);
    const settling = await this.pool.query(
      `SELECT metadata->>'type' AS type
       FROM entries
       WHERE metadata->>'holdEntryId' = $1
         AND metadata->>'type' IN ($2, $3)
       ORDER BY created_at ASC`,
      [holdId, CAPTURE_TYPE, RELEASE_TYPE],
    );
    for (const row of settling.rows as Array<{ type: string }>) {
      if (row.type === CAPTURE_TYPE) {
        return this.toHold(hold, 'CAPTURED', Number(hold.amount));
      }
    }
    for (const row of settling.rows as Array<{ type: string }>) {
      if (row.type === RELEASE_TYPE) {
        return this.toHold(hold, 'RELEASED', Number(hold.amount));
      }
    }
    return this.toHold(hold, 'HELD', Number(hold.amount));
  }

  /**
   * Move funds out of escrow to a ledger account.
   *
   * The destination is a ledger `accounts.id` (the only destination an internal
   * rail can address). No migrated caller uses this; it exists so the port's
   * surface is complete rather than a stub wearing an implementation's clothes.
   */
  async transferFunds(
    amountCents: number,
    destinationAccountId: string,
    metadata?: Record<string, any>,
    idempotencyKey?: string,
  ): Promise<{ id: string; amountCents: number }> {
    const escrowAccountId = await this.requireSystemAccount('SYSTEM_ESCROW');
    const entryId = await this.ledger.recordTransaction(
      escrowAccountId,
      destinationAccountId,
      amountCents,
      undefined,
      { type: TRANSFER_TYPE, ...(metadata ?? {}) },
      undefined,
      idempotencyKey,
    );
    return { id: entryId, amountCents };
  }

  resolveDisposition(
    outcome: 'COMPLETED' | 'FAILED',
    jurisdictionTier: JurisdictionTier,
  ): StakeDisposition {
    return resolveStakeDisposition(outcome, jurisdictionTier);
  }

  private async requireSystemAccount(name: string): Promise<string> {
    const result = await this.pool.query(
      'SELECT id FROM accounts WHERE name = $1 LIMIT 1',
      [name],
    );
    if (result.rows.length === 0) {
      throw new Error(
        `Ledger escrow rail cannot ${name === 'SYSTEM_ESCROW' ? 'take custody' : 'settle'}: account ${name} is missing. ` +
          'Run migrations 067+ which create the ledger system accounts.',
      );
    }
    return result.rows[0].id as string;
  }

  private async loadHold(holdId: string): Promise<LedgerHoldRow> {
    const result = await this.pool.query(
      `SELECT id, debit_account_id, credit_account_id, amount, contract_id, metadata
       FROM entries
       WHERE id = $1`,
      [holdId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Ledger hold ${holdId} not found`);
    }
    return result.rows[0] as LedgerHoldRow;
  }

  private toHold(
    hold: LedgerHoldRow,
    status: EscrowHoldStatus,
    amountCents: number,
  ): EscrowHold {
    return {
      id: hold.id,
      status,
      amountCents,
      currency: 'usd',
      rail: this.rail,
    };
  }
}
