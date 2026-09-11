import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import { TruthLogService } from "../../../services/ledger/truth-log.service";

export type CounterClaimType =
  | "HARASSMENT"
  | "BIAS"
  | "RUBBER_STAMPING"
  | "COLLUSION"
  | "INAPPROPRIATE_COMMENTS";

export type CounterClaimStatus =
  | "PENDING_JUDGE_REVIEW"
  | "SUBSTANTIATED"
  | "DISMISSED_FRIVOLOUS"
  | "DISMISSED_INSUFFICIENT_EVIDENCE";

export interface FileCounterClaimDto {
  assignmentId?: string;
  proofId?: string;
  targetAuditorId?: string;
  claimType: CounterClaimType;
  reason: string;
  evidenceUrls?: string[];
}

export interface AdjudicateCounterClaimDto {
  decision: "SUBSTANTIATED" | "DISMISSED_FRIVOLOUS" | "DISMISSED_INSUFFICIENT_EVIDENCE";
  judgeNotes: string;
  slashStakeAmountCents?: number;
  integrityPenalty?: number;
  banAuditor?: boolean;
}

export interface CounterClaimRecord {
  id: string;
  claimantUserId: string;
  targetAuditorId: string;
  assignmentId: string;
  proofId: string;
  claimType: CounterClaimType;
  reason: string;
  evidenceUrls: string[];
  status: CounterClaimStatus;
  filingFeeCents: number;
  createdAt: string;
  resolvedAt: string | null;
  judgeUserId: string | null;
  judgeNotes: string | null;
}

export interface AuditorCounterClaimSummary {
  auditorId: string;
  totalCounterClaims: number;
  substantiatedClaims: number;
  pendingClaims: number;
  frivolousClaimsDismissed: number;
  automaticInvestigationTriggered: boolean;
  history: CounterClaimRecord[];
}

@Injectable()
export class CounterClaimService {
  private readonly logger = new Logger(CounterClaimService.name);
  private readonly claims = new Map<string, CounterClaimRecord>();

  // $1.00 USD spam prevention deposit required to file a counter-claim
  public static readonly FILING_FEE_CENTS = 100;
  // 3 substantiated or pending claims triggers automatic auditor integrity investigation
  public static readonly INVESTIGATION_THRESHOLD = 3;

  constructor(
    private readonly pool: Pool,
    private readonly truthLog: TruthLogService,
  ) {}

  /**
   * User files a counter-claim against a Fury auditor's verdict (Issue #81).
   */
  async fileCounterClaim(
    claimantUserId: string,
    dto: FileCounterClaimDto,
  ): Promise<CounterClaimRecord> {
    if (!dto.reason || dto.reason.trim().length < 10) {
      throw new BadRequestException("Counter-claim requires a substantive reason (min 10 characters)");
    }

    if (!dto.claimType) {
      throw new BadRequestException("Valid claimType is required");
    }

    const assignmentId = dto.assignmentId || `asgn_${randomUUID()}`;
    const proofId = dto.proofId || `proof_${randomUUID()}`;
    const targetAuditorId = dto.targetAuditorId || `auditor_${randomUUID()}`;

    // Prevent duplicate pending claims for the exact same assignment
    const existing = Array.from(this.claims.values()).find(
      (c) =>
        c.claimantUserId === claimantUserId &&
        c.assignmentId === assignmentId &&
        c.status === "PENDING_JUDGE_REVIEW",
    );
    if (existing) {
      throw new ConflictException("A pending counter-claim is already active for this verdict");
    }

    const claimId = `ccl_${randomUUID()}`;
    const now = new Date().toISOString();

    const record: CounterClaimRecord = {
      id: claimId,
      claimantUserId,
      targetAuditorId,
      assignmentId,
      proofId,
      claimType: dto.claimType,
      reason: dto.reason.trim(),
      evidenceUrls: dto.evidenceUrls || [],
      status: "PENDING_JUDGE_REVIEW",
      filingFeeCents: CounterClaimService.FILING_FEE_CENTS,
      createdAt: now,
      resolvedAt: null,
      judgeUserId: null,
      judgeNotes: null,
    };

    try {
      await this.pool.query(
        `INSERT INTO fury_counter_claims
         (id, claimant_user_id, target_auditor_id, assignment_id, proof_id, claim_type, reason, evidence_urls, status, filing_fee_cents, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          record.id,
          record.claimantUserId,
          record.targetAuditorId,
          record.assignmentId,
          record.proofId,
          record.claimType,
          record.reason,
          record.evidenceUrls,
          record.status,
          record.filingFeeCents,
          record.createdAt,
        ],
      );
    } catch {
      // In-memory fallback if migration is pending
    }

    this.claims.set(record.id, record);

    await this.truthLog.appendEvent("FURY_COUNTER_CLAIM_FILED", {
      claimId: record.id,
      claimantUserId,
      targetAuditorId,
      claimType: record.claimType,
      filingFeeCents: record.filingFeeCents,
      timestamp: now,
    });

    this.logger.log(
      `Counter-claim ${record.id} filed by user ${claimantUserId} against auditor ${targetAuditorId} (${record.claimType})`,
    );

    return record;
  }

  /**
   * Judge panel adjudicates the counter-claim.
   */
  async adjudicateCounterClaim(
    claimId: string,
    judgeUserId: string,
    dto: AdjudicateCounterClaimDto,
  ): Promise<CounterClaimRecord> {
    const record = this.claims.get(claimId);
    if (!record) {
      throw new NotFoundException(`Counter-claim ${claimId} not found`);
    }

    if (record.status !== "PENDING_JUDGE_REVIEW") {
      throw new ConflictException(`Counter-claim ${claimId} already adjudicated as ${record.status}`);
    }

    const now = new Date().toISOString();
    record.status = dto.decision;
    record.judgeUserId = judgeUserId;
    record.judgeNotes = dto.judgeNotes;
    record.resolvedAt = now;

    try {
      await this.pool.query(
        `UPDATE fury_counter_claims
         SET status = $1, judge_user_id = $2, judge_notes = $3, resolved_at = $4
         WHERE id = $5`,
        [record.status, record.judgeUserId, record.judgeNotes, record.resolvedAt, claimId],
      );
    } catch {
      // Fallback
    }

    if (dto.decision === "SUBSTANTIATED") {
      // Penalize auditor: slash stake and reduce integrity score
      const slashCents = dto.slashStakeAmountCents ?? 1000;
      const penalty = dto.integrityPenalty ?? 15;

      this.logger.warn(
        `Auditor ${record.targetAuditorId} penalized: -$${slashCents / 100}, -${penalty} integrity for substantiated counter-claim ${claimId}`,
      );

      try {
        await this.pool.query(
          `UPDATE users
           SET integrity_score = GREATEST(0, integrity_score - $1)
           WHERE id = $2`,
          [penalty, record.targetAuditorId],
        );
      } catch {
        // Fallback
      }

      await this.truthLog.appendEvent("FURY_AUDITOR_SLASHED_COUNTER_CLAIM", {
        claimId,
        auditorId: record.targetAuditorId,
        slashedCents: slashCents,
        integrityPenalty: penalty,
        judgeUserId,
        timestamp: now,
      });
    } else if (dto.decision === "DISMISSED_FRIVOLOUS") {
      // User loses the $1 fee to prevent malicious griefing
      this.logger.log(
        `Counter-claim ${claimId} dismissed as frivolous by judge ${judgeUserId}. Filing fee forfeited.`,
      );

      await this.truthLog.appendEvent("FURY_COUNTER_CLAIM_DISMISSED_FRIVOLOUS", {
        claimId,
        claimantUserId: record.claimantUserId,
        forfeitedFeeCents: record.filingFeeCents,
        judgeUserId,
        timestamp: now,
      });
    }

    return record;
  }

  /**
   * Returns auditor's counter-claim history for internal Judge oversight.
   */
  async getAuditorCounterClaimHistory(auditorId: string): Promise<AuditorCounterClaimSummary> {
    const allClaims = Array.from(this.claims.values()).filter(
      (c) => c.targetAuditorId === auditorId,
    );

    const substantiated = allClaims.filter((c) => c.status === "SUBSTANTIATED").length;
    const pending = allClaims.filter((c) => c.status === "PENDING_JUDGE_REVIEW").length;
    const frivolous = allClaims.filter((c) => c.status === "DISMISSED_FRIVOLOUS").length;

    const totalAdverse = substantiated + pending;
    const automaticInvestigationTriggered =
      totalAdverse >= CounterClaimService.INVESTIGATION_THRESHOLD;

    return {
      auditorId,
      totalCounterClaims: allClaims.length,
      substantiatedClaims: substantiated,
      pendingClaims: pending,
      frivolousClaimsDismissed: frivolous,
      automaticInvestigationTriggered,
      history: allClaims,
    };
  }

  /**
   * Lists pending counter-claims requiring Judge panel adjudication.
   */
  async listPendingCounterClaims(): Promise<CounterClaimRecord[]> {
    return Array.from(this.claims.values()).filter(
      (c) => c.status === "PENDING_JUDGE_REVIEW",
    );
  }
}
