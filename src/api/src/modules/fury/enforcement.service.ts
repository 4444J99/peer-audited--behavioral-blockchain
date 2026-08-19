import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { AUDITOR_STAKE_AMOUNT } from '../../../../shared/libs/integrity';

/** Penalty types that move money, and therefore need a real amount and a reversible ledger leg. */
const FINANCIAL_PENALTY_TYPES = new Set(['STAKE_SLASH']);

const DEFAULT_READ_LIMIT = 50;
const MAX_READ_LIMIT = 200;
const DEFAULT_RING_WINDOW_HOURS = 24 * 30;
const MAX_RING_WINDOW_HOURS = 24 * 365;

export interface EnforcementCaseRow {
  id: string;
  reviewer_id: string;
  case_type: string;
  confidence: number;
  status: string;
  evidence_json: Record<string, unknown>;
  created_at: string;
  integrity_score: number | null;
  reviewer_status: string | null;
  penalty_type: string | null;
  amount_cents: number | null;
  applied_at: string | null;
}

export interface CollusionRingMember {
  caseId: string;
  reviewerId: string;
  status: string;
  integrityScore: number | null;
}

export interface CollusionRingRow {
  ring_id: string;
  detected_at: string;
  confidence: number;
  member_count: number;
  pending_count: number;
  penalized_count: number;
  appealed_count: number;
  signal_count: number | null;
  signal_types: string[] | null;
  members: CollusionRingMember[];
}

/**
 * Query-string numbers arrive as strings and an unbounded LIMIT is a trivial
 * memory-pressure lever on an authenticated endpoint, so both read paths clamp
 * rather than trusting the caller.
 */
function clampLimit(raw: number | string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_READ_LIMIT;
  return Math.min(Math.floor(parsed), MAX_READ_LIMIT);
}

function clampSinceHours(raw: number | string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_RING_WINDOW_HOURS;
  return Math.min(Math.floor(parsed), MAX_RING_WINDOW_HOURS);
}

@Injectable()
export class EnforcementService {
  private readonly logger = new Logger(EnforcementService.name);

  constructor(
    private readonly pool: Pool,
    private readonly truthLog: TruthLogService,
    // A penalty that took money can only be undone by moving money back. Without
    // the ledger this service could delete its own bookkeeping and call it a
    // reversal — which is exactly what it used to do.
    private readonly ledger: LedgerService,
  ) {}

  async evaluateCollusion(proofId: string, flaggedFuries: string[]): Promise<void> {
    if (!flaggedFuries || flaggedFuries.length === 0) return;

    for (const furyId of flaggedFuries) {
      // Open an enforcement case for failing a honeypot. A single honeypot miss is
      // suggestive, not conclusive — the case stays PENDING_REVIEW and the penalty
      // (REP_BURN) is only applied after a reviewer confirms it via confirmCase().
      //
      // Idempotent per (reviewer, proof). Now that FuryWorker.checkConsensus calls
      // this automatically, the LC5 retry path matters: a post-claim failure reverts
      // the proof to UNDER_REVIEW and the whole consensus block re-runs, which would
      // otherwise file a second case for the same honeypot miss. Same
      // INSERT...SELECT...WHERE NOT EXISTS shape as applyPenalty — atomic within the
      // statement, so a concurrent re-entry cannot duplicate either.
      const caseResult = await this.pool.query(
        `INSERT INTO fury_enforcement_cases (reviewer_id, case_type, confidence, status, evidence_json)
         SELECT $1, 'HONEYPOT_FAILURE', 0.5, 'PENDING_REVIEW', $2::jsonb
         WHERE NOT EXISTS (
           SELECT 1 FROM fury_enforcement_cases
           WHERE reviewer_id = $1
             AND case_type = 'HONEYPOT_FAILURE'
             AND evidence_json->>'proofId' = $3
         )
         RETURNING id`,
        [
          furyId,
          JSON.stringify({ proofId, reason: 'Verdict disagreed with honeypot expected result' }),
          proofId,
        ]
      );

      if (caseResult.rows.length === 0) {
        // A case for this reviewer on this proof already exists (idempotent no-op).
        continue;
      }

      const caseId = caseResult.rows[0].id;

      await this.truthLog.appendEvent('FURY_ENFORCEMENT_CASE_OPENED', {
        caseId,
        reviewerId: furyId,
        proofId,
        caseType: 'HONEYPOT_FAILURE',
      });
    }
  }

  /**
   * Read side of the enforcement queue — what an admin triages before calling
   * confirmCase / resolveAppeal.
   *
   * `users.email` is deliberately not selected. This is a list surface over every
   * flagged reviewer, and reviewer_id is the identifier the rest of the admin
   * surface already keys on; integrity_score is the signal an admin actually needs
   * next to a case. The single-user admin lookup remains the place email is read.
   */
  async listCases(
    filters: { status?: string; caseType?: string; limit?: number } = {},
  ): Promise<{ cases: EnforcementCaseRow[] }> {
    const limit = clampLimit(filters.limit);

    const result = await this.pool.query(
      `SELECT
         c.id,
         c.reviewer_id,
         c.case_type,
         c.confidence,
         c.status,
         c.evidence_json,
         c.created_at,
         u.integrity_score,
         u.status AS reviewer_status,
         p.penalty_type,
         p.amount_cents,
         p.applied_at
       FROM fury_enforcement_cases c
       LEFT JOIN users u ON u.id = c.reviewer_id
       LEFT JOIN fury_penalties p ON p.case_id = c.id
       WHERE ($1::text IS NULL OR c.status = $1)
         AND ($2::text IS NULL OR c.case_type = $2)
       ORDER BY c.created_at DESC
       LIMIT $3`,
      [filters.status || null, filters.caseType || null, limit],
    );

    return { cases: result.rows };
  }

  /**
   * Collusion detections grouped back into the rings that produced them.
   *
   * There is no rings table: `CollusionDetectionService.sanctionRing` writes one
   * case per ring member and carries the cluster identity in evidence_json.ringId,
   * so the ring is reconstructed by grouping on that key. signalTypes is taken from
   * the earliest member's evidence because every member of one ring is written with
   * the same signal summary in the same call.
   */
  async listCollusionRings(
    options: { sinceHours?: number; limit?: number } = {},
  ): Promise<{ rings: CollusionRingRow[] }> {
    const limit = clampLimit(options.limit);
    const sinceHours = clampSinceHours(options.sinceHours);

    const result = await this.pool.query(
      `SELECT
         c.evidence_json->>'ringId' AS ring_id,
         MIN(c.created_at) AS detected_at,
         MAX(c.confidence) AS confidence,
         COUNT(*)::int AS member_count,
         COUNT(*) FILTER (WHERE c.status = 'PENDING_REVIEW')::int AS pending_count,
         COUNT(*) FILTER (WHERE c.status = 'PENALTY_APPLIED')::int AS penalized_count,
         COUNT(*) FILTER (WHERE c.status = 'APPEALED')::int AS appealed_count,
         MAX((c.evidence_json->>'signalCount')::int) AS signal_count,
         (jsonb_agg(c.evidence_json->'signalTypes' ORDER BY c.created_at))->0 AS signal_types,
         jsonb_agg(
           jsonb_build_object(
             'caseId', c.id,
             'reviewerId', c.reviewer_id,
             'status', c.status,
             'integrityScore', u.integrity_score
           ) ORDER BY c.created_at
         ) AS members
       FROM fury_enforcement_cases c
       LEFT JOIN users u ON u.id = c.reviewer_id
       WHERE c.case_type = 'COLLUSION_RING'
         AND c.evidence_json->>'ringId' IS NOT NULL
         AND c.created_at >= NOW() - ($1::int * INTERVAL '1 hour')
       GROUP BY c.evidence_json->>'ringId'
       ORDER BY MIN(c.created_at) DESC
       LIMIT $2`,
      [sinceHours, limit],
    );

    return { rings: result.rows };
  }

  /**
   * Confirms a pending enforcement case after review and applies the penalty.
   * Penalties are never auto-applied before this confirmation step.
   */
  async confirmCase(caseId: string, penaltyType: string = 'REP_BURN', amountCents?: number) {
    // A STAKE_SLASH with no amount used to become a silent $0 penalty — the case
    // read as punished while nothing was taken. Derive from the auditor stake
    // when the caller omits it, and refuse a non-positive explicit amount.
    const resolvedAmount = FINANCIAL_PENALTY_TYPES.has(penaltyType)
      ? amountCents ?? AUDITOR_STAKE_AMOUNT
      : amountCents ?? 0;
    if (FINANCIAL_PENALTY_TYPES.has(penaltyType) && resolvedAmount <= 0) {
      throw new BadRequestException(
        `${penaltyType} is a financial penalty and requires a positive amountCents.`,
      );
    }
    // Atomically claim the case (TOCTOU-safe): only the caller that flips
    // PENDING_REVIEW -> PENALTY_APPLIED proceeds, so two concurrent confirmations
    // can't both apply a penalty. The loser matches zero rows and is rejected.
    const claim = await this.pool.query(
      `UPDATE fury_enforcement_cases SET status = 'PENALTY_APPLIED'
       WHERE id = $1 AND status = 'PENDING_REVIEW'
       RETURNING id`,
      [caseId]
    );

    if (claim.rows.length === 0) {
      throw new NotFoundException('Pending case not found');
    }

    await this.applyPenalty(caseId, penaltyType, resolvedAmount);
    return { success: true, caseId, status: 'PENALTY_APPLIED', amountCents: resolvedAmount };
  }

  async applyPenalty(caseId: string, penaltyType: string, amountCents: number = 0) {
    // LC9: applyPenalty is public and was previously unconditional, so a direct or
    // legacy caller invoking it on an already-applied case inserted a DUPLICATE
    // penalty (and double-logged FURY_PENALTY_APPLIED). There is no UNIQUE
    // constraint on fury_penalties.case_id, so we guard idempotency in SQL: insert
    // exactly one penalty per case via INSERT...SELECT...WHERE NOT EXISTS, which is
    // atomic within the single statement. If a row already exists, RETURNING yields
    // zero rows and we bail without re-applying status or re-appending to TruthLog.
    const inserted = await this.pool.query(
      `INSERT INTO fury_penalties (case_id, penalty_type, amount_cents)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (SELECT 1 FROM fury_penalties WHERE case_id = $1)
       RETURNING id`,
      [caseId, penaltyType, amountCents]
    );

    if (inserted.rows.length === 0) {
      // A penalty for this case already exists — nothing to do (idempotent no-op).
      return;
    }

    await this.pool.query(
      `UPDATE fury_enforcement_cases SET status = 'PENALTY_APPLIED' WHERE id = $1`,
      [caseId]
    );

    const caseData = await this.pool.query(`SELECT reviewer_id FROM fury_enforcement_cases WHERE id = $1`, [caseId]);

    await this.truthLog.appendEvent('FURY_PENALTY_APPLIED', {
      caseId,
      penaltyType,
      reviewerId: caseData.rows[0].reviewer_id,
    });
  }

  async appealCase(caseId: string, reviewerId: string, reason: string) {
    const caseResult = await this.pool.query(
      `SELECT id FROM fury_enforcement_cases WHERE id = $1 AND reviewer_id = $2`,
      [caseId, reviewerId]
    );

    if (caseResult.rows.length === 0) {
      throw new NotFoundException('Case not found');
    }

    await this.pool.query(
      `UPDATE fury_enforcement_cases SET status = 'APPEALED', evidence_json = evidence_json || jsonb_build_object('appeal_reason', $2::text) WHERE id = $1`,
      [caseId, reason]
    );

    await this.truthLog.appendEvent('FURY_PENALTY_APPEALED', {
      caseId,
      reviewerId,
      reason,
    });

    return { success: true, caseId, status: 'APPEALED' };
  }

  /**
   * Resolves an appeal: UPHELD (penalty stands) or REVERSED (penalty overturned).
   * Admin-only. Idempotent — resolving an already-resolved appeal is a no-op.
   */
  async resolveAppeal(caseId: string, outcome: 'UPHELD' | 'REVERSED', reason?: string) {
    if (outcome !== 'UPHELD' && outcome !== 'REVERSED') {
      throw new BadRequestException('Outcome must be UPHELD or REVERSED');
    }

    const claim = await this.pool.query(
      `UPDATE fury_enforcement_cases
       SET status = $1,
           evidence_json = evidence_json || jsonb_build_object(
             'appeal_resolution', $1::text,
             'appeal_reason', COALESCE($3::text, ''),
             'resolved_at', NOW()::text
           )
       WHERE id = $2 AND status = 'APPEALED'
       RETURNING id, reviewer_id`,
      [outcome, caseId, reason || null],
    );

    if (claim.rows.length === 0) {
      throw new NotFoundException('Appealed case not found or already resolved');
    }

    const { reviewer_id: reviewerId } = claim.rows[0];

    let refundedCents = 0;
    if (outcome === 'REVERSED') {
      refundedCents = await this.reversePenalty(caseId, reviewerId);
    }

    await this.truthLog.appendEvent('FURY_APPEAL_RESOLVED', {
      caseId,
      reviewerId,
      outcome,
      reason: reason || null,
      refundedCents,
    });

    return { success: true, caseId, outcome, refundedCents };
  }

  /**
   * Undoes a penalty. Returns the cents actually refunded (0 for a
   * non-financial penalty such as REP_BURN, which has no ledger effect to undo).
   *
   * Compensating entry, not a deletion: the original charge stays on the ledger
   * and a reversing transaction is posted against it, because a double-entry
   * ledger records what happened, and the slash did happen. `reversal_transaction_id`
   * makes this idempotent — re-resolving an already-reversed case refunds nothing
   * a second time.
   */
  private async reversePenalty(caseId: string, reviewerId: string): Promise<number> {
    const penalty = await this.pool.query(
      `SELECT id, amount_cents, ledger_transaction_id, ledger_debit_account_id, reversal_transaction_id
       FROM fury_penalties
       WHERE case_id = $1`,
      [caseId],
    );

    if (penalty.rows.length === 0) return 0;
    const row = penalty.rows[0];

    if (row.reversal_transaction_id) {
      // Already refunded by an earlier resolution — do not pay twice.
      return Number(row.amount_cents ?? 0);
    }

    const amountCents = Number(row.amount_cents ?? 0);
    if (!row.ledger_transaction_id || !row.ledger_debit_account_id || amountCents <= 0) {
      // A penalty with no financial leg (REP_BURN, or a legacy row predating the
      // ledger link in migration 069). Mark it reversed; there is no money to move.
      await this.pool.query(
        `UPDATE fury_penalties SET reversed_at = NOW() WHERE id = $1`,
        [row.id],
      );
      return 0;
    }

    const revenue = await this.pool.query(
      `SELECT id FROM accounts WHERE name = 'SYSTEM_REVENUE'`,
    );
    if (revenue.rows.length === 0) {
      throw new BadRequestException(
        'Cannot reverse a financial penalty: SYSTEM_REVENUE account is missing.',
      );
    }

    // Mirror of the original charge: revenue pays the reviewer back.
    const reversalId = await this.ledger.recordTransaction(
      revenue.rows[0].id,
      row.ledger_debit_account_id,
      amountCents,
      undefined,
      {
        type: 'FURY_PENALTY_REVERSAL',
        caseId,
        reviewerId,
        reversesTransactionId: row.ledger_transaction_id,
      },
      undefined,
      `fury-appeal-reversal:${caseId}`,
    );

    await this.pool.query(
      `UPDATE fury_penalties
       SET reversed_at = NOW(), reversal_transaction_id = $2
       WHERE id = $1`,
      [row.id, reversalId],
    );

    await this.truthLog.appendEvent('FURY_PENALTY_REVERSED', {
      caseId,
      reviewerId,
      amountCents,
      reversalTransactionId: reversalId,
      reversesTransactionId: row.ledger_transaction_id,
    });

    return amountCents;
  }
}

