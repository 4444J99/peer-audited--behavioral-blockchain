import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Pool } from "pg";
import { TruthLogService } from "../ledger/truth-log.service";

export type ContentType =
  | "PROOF_MEDIA"
  | "PROFILE_TEXT"
  | "CONTRACT_TITLE"
  | "WHISTLEBLOWER_REPORT";
export type FlagSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FlagStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REMOVED"
  | "ESCALATED";
export type AppealStatus = "PENDING" | "UPHELD" | "OVERTURNED";

export interface ContentFlag {
  id: string;
  content_type: ContentType;
  content_id: string;
  reporter_id: string | null;
  reason: string;
  details: string | null;
  severity: FlagSeverity;
  status: FlagStatus;
  auto_flagged: boolean;
  auto_filter_matches: string[];
  reviewed_by: string | null;
  reviewed_at: Date | null;
  review_notes: string | null;
  appeal_text: string | null;
  appeal_status: AppealStatus | null;
  created_at: Date;
  updated_at: Date;
}

/** Keywords that trigger automatic flagging — App Store compliance */
const BLOCKED_KEYWORDS: Record<string, FlagSeverity> = {
  // Critical — immediate hold
  violence: "CRITICAL",
  weapon: "CRITICAL",
  kill: "CRITICAL",
  threat: "CRITICAL",
  abuse: "CRITICAL",
  // High — human review required
  nudity: "HIGH",
  explicit: "HIGH",
  drug: "HIGH",
  illegal: "HIGH",
  // Medium — flagged for review
  hate: "MEDIUM",
  discrimination: "MEDIUM",
  harassment: "MEDIUM",
  // Low — logged only
  spam: "LOW",
  scam: "LOW",
};

@Injectable()
export class ModerationService {
  constructor(
    private readonly truthLog: TruthLogService,
    private readonly pool: Pool,
  ) {}

  /**
   * Permanently exiles a user from the platform by writing an irrevocable BANNED event.
   * Enforces zero-trust access: verifies admin role via database lookup.
   */
  async banUser(
    adminId: string,
    targetUserId: string,
    reason: string,
  ): Promise<{ status: string; eventId: string }> {
    // Verify admin role via database lookup (not string prefix)
    const adminResult = await this.pool.query(
      "SELECT role FROM users WHERE id = $1",
      [adminId],
    );
    if (adminResult.rows.length === 0 || adminResult.rows[0].role !== "ADMIN") {
      throw new ForbiddenException(
        `Moderation Error: User ${adminId} lacks the required 'ADMIN' role to execute a system ban.`,
      );
    }

    const payload = {
      targetUserId,
      reason,
      executedBy: adminId,
      action: "PERMANENT_EXILE",
    };

    // Commit to the immutable log
    const logResult = await this.truthLog.appendEvent(
      "ACCOUNT_BANNED",
      payload,
    );

    // Enforce ban in user status — contracts service checks user.status
    await this.pool.query(`UPDATE users SET status = 'BANNED' WHERE id = $1`, [
      targetUserId,
    ]);

    return {
      status: "USER_PERMANENTLY_BANNED",
      eventId: logResult,
    };
  }

  /**
   * Automated keyword filter. Scans text for blocked keywords and returns matches.
   * Used as pre-screening before content enters the Fury queue (App Store §1.2).
   */
  autoFilter(text: string): string[] {
    const lower = text.toLowerCase();
    const matches: string[] = [];
    for (const keyword of Object.keys(BLOCKED_KEYWORDS)) {
      if (lower.includes(keyword)) {
        matches.push(keyword);
      }
    }
    return matches;
  }

  /**
   * Flags content for moderation review. Can be called by:
   * - Automated filter (auto_flagged = true)
   * - Fury auditors reporting inappropriate content
   * - Users appealing decisions
   */
  async flagContent(
    contentType: ContentType,
    contentId: string,
    reason: string,
    options?: {
      reporterId?: string;
      details?: string;
      autoFlagged?: boolean;
      autoFilterMatches?: string[];
    },
  ): Promise<ContentFlag> {
    // Determine severity from auto-filter matches
    let severity: FlagSeverity = "LOW";
    if (options?.autoFilterMatches && options.autoFilterMatches.length > 0) {
      severity = options.autoFilterMatches.reduce<FlagSeverity>(
        (max, keyword) => {
          const kwSeverity = BLOCKED_KEYWORDS[keyword] || "LOW";
          const order: FlagSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
          return order.indexOf(kwSeverity) > order.indexOf(max)
            ? kwSeverity
            : max;
        },
        "LOW",
      );
    }

    const result = await this.pool.query(
      `INSERT INTO content_flags (content_type, content_id, reporter_id, reason, details, severity, auto_flagged, auto_filter_matches)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        contentType,
        contentId,
        options?.reporterId || null,
        reason,
        options?.details || null,
        severity,
        options?.autoFlagged || false,
        options?.autoFilterMatches || [],
      ],
    );

    const flag = result.rows[0] as ContentFlag;

    // Log to immutable audit trail
    await this.truthLog.appendEvent("CONTENT_FLAGGED", {
      flagId: flag.id,
      contentType,
      contentId,
      severity,
      reason,
      autoFlagged: options?.autoFlagged || false,
    });

    return flag;
  }

  /**
   * Scans content through auto-filter and flags if matches found.
   * Returns null if content is clean, or the flag if it was flagged.
   */
  async scanAndFlag(
    contentType: ContentType,
    contentId: string,
    text: string,
  ): Promise<ContentFlag | null> {
    const matches = this.autoFilter(text);
    if (matches.length === 0) return null;

    return this.flagContent(
      contentType,
      contentId,
      "Auto-filter keyword match",
      {
        autoFlagged: true,
        autoFilterMatches: matches,
      },
    );
  }

  /**
   * Returns the moderation queue, filtered by status.
   */
  async getQueue(status?: FlagStatus): Promise<ContentFlag[]> {
    if (status) {
      const result = await this.pool.query(
        "SELECT * FROM content_flags WHERE status = $1 ORDER BY severity DESC, created_at ASC",
        [status],
      );
      return result.rows as ContentFlag[];
    }
    const result = await this.pool.query(
      "SELECT * FROM content_flags ORDER BY severity DESC, created_at ASC",
    );
    return result.rows as ContentFlag[];
  }

  /**
   * Admin reviews flagged content: approve or remove.
   */
  async reviewContent(
    adminId: string,
    flagId: string,
    decision: "APPROVED" | "REMOVED",
    notes: string,
  ): Promise<ContentFlag> {
    // Verify admin role
    const adminResult = await this.pool.query(
      "SELECT role FROM users WHERE id = $1",
      [adminId],
    );
    if (adminResult.rows.length === 0 || adminResult.rows[0].role !== "ADMIN") {
      throw new ForbiddenException("Only admins can review flagged content");
    }

    const result = await this.pool.query(
      `UPDATE content_flags SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3
       WHERE id = $4 RETURNING *`,
      [decision, adminId, notes, flagId],
    );

    if (result.rows.length === 0) {
      throw new BadRequestException(`Flag ${flagId} not found`);
    }

    const flag = result.rows[0] as ContentFlag;

    await this.truthLog.appendEvent("CONTENT_REVIEWED", {
      flagId,
      decision,
      reviewedBy: adminId,
      notes,
    });

    return flag;
  }

  /**
   * User appeals a moderation decision.
   */
  async appealContent(
    flagId: string,
    userId: string,
    appealText: string,
  ): Promise<ContentFlag> {
    // Verify the flag exists and is in a reviewable state
    const flagResult = await this.pool.query(
      "SELECT * FROM content_flags WHERE id = $1",
      [flagId],
    );
    if (flagResult.rows.length === 0) {
      throw new BadRequestException(`Flag ${flagId} not found`);
    }

    const flag = flagResult.rows[0] as ContentFlag;
    if (flag.status === "PENDING" || flag.status === "UNDER_REVIEW") {
      throw new BadRequestException(
        "Cannot appeal a decision that has not been reviewed yet",
      );
    }

    const result = await this.pool.query(
      `UPDATE content_flags SET appeal_text = $1, appeal_status = 'PENDING', status = 'UNDER_REVIEW'
       WHERE id = $2 RETURNING *`,
      [appealText, flagId],
    );

    await this.truthLog.appendEvent("CONTENT_APPEALED", {
      flagId,
      appealedBy: userId,
      appealText,
    });

    return result.rows[0] as ContentFlag;
  }

  /**
   * Admin resolves an appeal: uphold (keep decision) or overturn (restore content).
   */
  async resolveAppeal(
    adminId: string,
    flagId: string,
    resolution: "UPHELD" | "OVERTURNED",
    notes: string,
  ): Promise<ContentFlag> {
    // Verify admin role
    const adminResult = await this.pool.query(
      "SELECT role FROM users WHERE id = $1",
      [adminId],
    );
    if (adminResult.rows.length === 0 || adminResult.rows[0].role !== "ADMIN") {
      throw new ForbiddenException("Only admins can resolve appeals");
    }

    const newStatus = resolution === "OVERTURNED" ? "APPROVED" : "REMOVED";

    const result = await this.pool.query(
      `UPDATE content_flags SET appeal_status = $1, status = $2, reviewed_by = $3, reviewed_at = NOW(), review_notes = $4
       WHERE id = $5 RETURNING *`,
      [resolution, newStatus, adminId, notes, flagId],
    );

    if (result.rows.length === 0) {
      throw new BadRequestException(`Flag ${flagId} not found`);
    }

    await this.truthLog.appendEvent("APPEAL_RESOLVED", {
      flagId,
      resolution,
      resolvedBy: adminId,
      notes,
    });

    return result.rows[0] as ContentFlag;
  }
}
