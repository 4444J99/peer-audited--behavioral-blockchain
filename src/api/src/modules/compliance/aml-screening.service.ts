import { Injectable, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';

export interface ScreeningResult {
  userId: string;
  riskLevel: 'CLEAR' | 'FLAGGED' | 'BLOCKED';
  matches: WatchlistMatch[];
  screenedAt: Date;
  notes?: string;
}

export interface WatchlistMatch {
  listType: string;
  matchedName: string;
  confidence: number;
  source: string;
}

export interface SARReport {
  id: string;
  userId: string;
  transactionIds: string[];
  suspicionType: string;
  description: string;
  filedAt: Date;
  status: 'DRAFT' | 'FILED';
}

export interface TransactionPattern {
  userId: string;
  pattern: 'STRUCTURING' | 'RAPID_MOVEMENT' | 'UNUSUAL_AMOUNT' | 'HIGH_RISK_JURISDICTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string;
}

const CTR_THRESHOLD_CENTS = 1_000_000;
const STRUCTURING_INDIVIDUAL_THRESHOLD_CENTS = 300_000;
const STRUCTURING_MIN_TXN = 3;
const STRUCTURING_WINDOW_HOURS = 24;
const RAPID_MOVEMENT_WINDOW_HOURS = 48;

@Injectable()
export class AmlScreeningService {
  private readonly logger = new Logger(AmlScreeningService.name);

  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
  ) {}

  async screenUser(userId: string): Promise<ScreeningResult> {
    const blocked = await this.isBlocked(userId);
    if (blocked) {
      const result: ScreeningResult = {
        userId,
        riskLevel: 'BLOCKED',
        matches: [],
        screenedAt: new Date(),
        notes: 'User is on internal blocklist',
      };
      await this.recordScreening(result);
      return result;
    }

    const matches: WatchlistMatch[] = [];

    const watchlistResult = await this.pool.query(
      `SELECT id, list_type, matched_name, confidence, source
       FROM internal_watchlist
       WHERE user_id = $1`,
      [userId],
    );

    for (const row of watchlistResult.rows) {
      matches.push({
        listType: row.list_type,
        matchedName: row.matched_name,
        confidence: row.confidence,
        source: row.source,
      });
    }

    const structuring = await this.detectStructuring(userId);
    const rapidMovement = await this.detectRapidMovement(userId);

    if (structuring) {
      matches.push({
        listType: 'PATTERN',
        matchedName: structuring.pattern,
        confidence: 0.85,
        source: 'INTERNAL_RULES',
      });
    }

    if (rapidMovement) {
      matches.push({
        listType: 'PATTERN',
        matchedName: rapidMovement.pattern,
        confidence: 0.80,
        source: 'INTERNAL_RULES',
      });
    }

    let riskLevel: ScreeningResult['riskLevel'] = 'CLEAR';
    if (matches.some((m) => m.confidence >= 0.9)) {
      riskLevel = 'FLAGGED';
    } else if (matches.length >= 2) {
      riskLevel = 'FLAGGED';
    }

    const result: ScreeningResult = {
      userId,
      riskLevel,
      matches,
      screenedAt: new Date(),
    };

    await this.recordScreening(result);
    return result;
  }

  async detectStructuring(userId: string): Promise<TransactionPattern | null> {
    const result = await this.pool.query(
      `SELECT id, amount_cents, created_at
       FROM entries
       JOIN accounts a ON entries.debit_account_id = a.id
       WHERE a.name = $1
         AND entries.amount_cents < $2
         AND entries.created_at >= NOW() - INTERVAL '1 hour' * $3
       ORDER BY entries.created_at ASC`,
      [
        `user:${userId}:stake`,
        STRUCTURING_INDIVIDUAL_THRESHOLD_CENTS,
        STRUCTURING_WINDOW_HOURS,
      ],
    );

    if (result.rows.length < STRUCTURING_MIN_TXN) {
      return null;
    }

    const totalCents = result.rows.reduce(
      (sum, row) => sum + Number(row.amount_cents),
      0,
    );

    if (totalCents < CTR_THRESHOLD_CENTS) {
      return null;
    }

    return {
      userId,
      pattern: 'STRUCTURING',
      severity: 'HIGH',
      details:
        `${result.rows.length} transactions totaling $${(totalCents / 100).toFixed(2)} ` +
        `within ${STRUCTURING_WINDOW_HOURS}h, each below $${(STRUCTURING_INDIVIDUAL_THRESHOLD_CENTS / 100).toFixed(2)}`,
    };
  }

  async detectRapidMovement(
    userId: string,
    windowHours: number = RAPID_MOVEMENT_WINDOW_HOURS,
  ): Promise<TransactionPattern | null> {
    const stakesResult = await this.pool.query(
      `SELECT c.id AS contract_id, c.stake_amount, c.created_at
       FROM contracts c
       WHERE c.user_id = $1
         AND c.status = 'PENDING_STAKE'
         AND c.created_at >= NOW() - INTERVAL '1 hour' * $2
         AND c.stake_amount > $3
       ORDER BY c.created_at DESC`,
      [userId, windowHours, STRUCTURING_INDIVIDUAL_THRESHOLD_CENTS],
    );

    if (stakesResult.rows.length === 0) {
      return null;
    }

    const contractIds = stakesResult.rows.map((r) => r.contract_id);
    const settlementsResult = await this.pool.query(
      `SELECT contract_id, outcome
       FROM settlement_runs
       WHERE contract_id = ANY($1)
         AND outcome = 'REFUND'`,
      [contractIds],
    );

    const refundedContractIds = new Set(
      settlementsResult.rows.map((r) => r.contract_id),
    );

    const rapidCancels = stakesResult.rows.filter((r) =>
      refundedContractIds.has(r.contract_id),
    );

    if (rapidCancels.length === 0) {
      return null;
    }

    const maxAmount = Math.max(
      ...rapidCancels.map((r) => Number(r.stake_amount)),
    );

    return {
      userId,
      pattern: 'RAPID_MOVEMENT',
      severity: maxAmount >= 1000 ? 'HIGH' : 'MEDIUM',
      details:
        `${rapidCancels.length} large stake(s) created and refunded within ${windowHours}h, ` +
        `max amount $${maxAmount.toFixed(2)}`,
    };
  }

  async fileSAR(
    userId: string,
    transactionIds: string[],
    suspicionType: string,
    description: string,
  ): Promise<SARReport> {
    const id = crypto.randomUUID();
    const filedAt = new Date();

    await this.pool.query(
      `INSERT INTO sar_reports (id, user_id, transaction_ids, suspicion_type, description, filed_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, userId, transactionIds, suspicionType, description, filedAt, 'DRAFT'],
    );

    return {
      id,
      userId,
      transactionIds,
      suspicionType,
      description,
      filedAt,
      status: 'DRAFT',
    };
  }

  async getSARHistory(userId: string): Promise<SARReport[]> {
    const result = await this.pool.query(
      `SELECT id, user_id, transaction_ids, suspicion_type, description, filed_at, status
       FROM sar_reports
       WHERE user_id = $1
       ORDER BY filed_at DESC`,
      [userId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      transactionIds: row.transaction_ids,
      suspicionType: row.suspicion_type,
      description: row.description,
      filedAt: new Date(row.filed_at),
      status: row.status,
    }));
  }

  async getScreeningHistory(userId: string): Promise<ScreeningResult[]> {
    const result = await this.pool.query(
      `SELECT user_id, risk_level, matches, screened_at, notes
       FROM aml_screenings
       WHERE user_id = $1
       ORDER BY screened_at DESC`,
      [userId],
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      riskLevel: row.risk_level,
      matches: row.matches ?? [],
      screenedAt: new Date(row.screened_at),
      notes: row.notes ?? undefined,
    }));
  }

  async isBlocked(userId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM internal_blocklist WHERE user_id = $1 LIMIT 1`,
      [userId],
    );

    return result.rows.length > 0;
  }

  private async recordScreening(result: ScreeningResult): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO aml_screenings (user_id, risk_level, matches, screened_at, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          result.userId,
          result.riskLevel,
          JSON.stringify(result.matches),
          result.screenedAt,
          result.notes ?? null,
        ],
      );
    } catch (err) {
      this.logger.error('Failed to record AML screening result', err);
    }
  }
}
