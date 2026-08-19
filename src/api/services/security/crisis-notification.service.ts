import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { Pool } from "pg";
import { CrisisDetectionResult } from "./crisis-detection.service";

export interface CrisisNotification {
  id: string;
  userId: string;
  severity: "MEDIUM" | "HIGH" | "CRITICAL";
  category: CrisisDetectionResult["category"];
  matchedKeywords: string[];
  source: "SELF_REPORT" | "PROOF_DESCRIPTION" | "CHECK_IN" | "SYSTEM";
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface FollowUpCheckIn {
  id: string;
  userId: string;
  crisisEventId: string;
  scheduledAt: string;
  status: "PENDING" | "COMPLETED" | "MISSED";
  response?: string;
  completedAt?: string;
}

/**
 * CrisisNotificationService — Aegis Protocol safety escalation layer.
 *
 * Manages safety team notifications and follow-up protocols for crisis events.
 * When a CRITICAL crisis is detected (self-report or proactive scan), this service:
 * 1. Sends a real-time notification to the safety team (webhook/Slack/email)
 * 2. Creates a follow-up check-in for the affected user
 * 3. Tracks acknowledgment status so no crisis goes unaddressed
 *
 * For MEDIUM/HIGH events detected proactively (via proof descriptions),
 * notifications are batched and sent hourly to avoid noise.
 */
@Injectable()
export class CrisisNotificationService {
  private readonly logger = new Logger(CrisisNotificationService.name);

  constructor(private readonly pool: Pool) {}

  /**
   * Sends a safety team notification for a crisis event.
   * CRITICAL events trigger immediate webhook delivery.
   * HIGH/MEDIUM events are queued for batch notification.
   */
  async notifySafetyTeam(
    userId: string,
    detection: CrisisDetectionResult,
    source: CrisisNotification["source"],
    triggerText: string,
  ): Promise<CrisisNotification> {
    const severity = detection.severity as CrisisNotification["severity"];

    const result = await this.pool.query(
      `INSERT INTO crisis_notifications (user_id, severity, category, matched_keywords, source, message, acknowledged)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING id, created_at`,
      [
        userId,
        severity,
        detection.category || "CRISIS_UNSPECIFIED",
        JSON.stringify(detection.matchedKeywords),
        source,
        triggerText,
      ],
    );

    const notification: CrisisNotification = {
      id: result.rows[0].id,
      userId,
      severity,
      category: detection.category,
      matchedKeywords: detection.matchedKeywords,
      source,
      message: triggerText,
      timestamp: result.rows[0].created_at,
      acknowledged: false,
    };

    if (severity === "CRITICAL") {
      await this.sendImmediateAlert(notification);
    }

    this.logger.warn(
      `Safety notification created: severity=${severity} source=${source} user=${userId}`,
    );

    return notification;
  }

  /**
   * Sends an immediate webhook/alert for CRITICAL crisis events.
   * In production, this integrates with Slack webhook, PagerDuty, or email relay.
   *
   * A missing CRISIS_WEBHOOK_URL in production is a fatal misconfiguration: a
   * CRITICAL alert with no delivery channel must never degrade to a log line.
   * We persist an operational alert row (same table/pattern as the missed
   * follow-up escalation, surfaced on the safety dashboard until acknowledged)
   * and then throw so callers and monitoring see the failure. Outside
   * production the warn-only path is kept for local/test convenience.
   */
  private async sendImmediateAlert(notification: CrisisNotification): Promise<void> {
    const webhookUrl = process.env.CRISIS_WEBHOOK_URL;

    if (!webhookUrl) {
      if (process.env.NODE_ENV === "production") {
        await this.pool.query(
          `INSERT INTO crisis_notifications (user_id, severity, category, matched_keywords, source, message, acknowledged)
           VALUES ($1, 'CRITICAL', 'CRISIS_UNSPECIFIED', '[]', 'SYSTEM', $2, false)`,
          [
            notification.userId,
            `OPERATIONAL ALERT: CRISIS_WEBHOOK_URL is not configured — CRITICAL crisis notification ${notification.id} was not delivered to the safety team. Immediate review required.`,
          ],
        );
        throw new InternalServerErrorException(
          `CRISIS_WEBHOOK_URL is not configured; CRITICAL crisis notification ${notification.id} cannot be delivered`,
        );
      }

      this.logger.warn(
        `CRITICAL crisis for user ${notification.userId} — no CRISIS_WEBHOOK_URL configured, alert logged only`,
      );
      return;
    }

    try {
      const payload = {
        text: `🚨 CRISIS ALERT — User ${notification.userId}`,
        severity: notification.severity,
        category: notification.category,
        keywords: notification.matchedKeywords,
        source: notification.source,
        message: notification.message,
        notificationId: notification.id,
        timestamp: notification.timestamp,
        action: "IMMEDIATE_REVIEW_REQUIRED",
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.logger.error(
          `Failed to send crisis webhook: ${response.status} ${response.statusText}`,
        );
      }
    } catch (err) {
      this.logger.error(`Crisis webhook delivery failed: ${err}`);
    }
  }

  /**
   * Schedules a follow-up check-in for a user who triggered a crisis event.
   * CRITICAL: check-in within 1 hour
   * HIGH: check-in within 24 hours
   * MEDIUM: check-in within 48 hours
   */
  async scheduleFollowUp(
    userId: string,
    crisisEventId: string,
    severity: CrisisNotification["severity"],
  ): Promise<FollowUpCheckIn> {
    const delayHours =
      severity === "CRITICAL" ? 1 : severity === "HIGH" ? 24 : 48;

    const scheduledAt = new Date(
      Date.now() + delayHours * 60 * 60 * 1000,
    ).toISOString();

    const result = await this.pool.query(
      `INSERT INTO crisis_follow_ups (user_id, crisis_event_id, scheduled_at, status)
       VALUES ($1, $2, $3, 'PENDING')
       RETURNING id`,
      [userId, crisisEventId, scheduledAt],
    );

    this.logger.log(
      `Follow-up scheduled for user ${userId}: ${severity} → check-in at ${scheduledAt}`,
    );

    return {
      id: result.rows[0].id,
      userId,
      crisisEventId,
      scheduledAt,
      status: "PENDING",
    };
  }

  /**
   * Records a user's response to a follow-up check-in.
   */
  async completeFollowUp(
    followUpId: string,
    response: string,
  ): Promise<FollowUpCheckIn> {
    const result = await this.pool.query(
      `UPDATE crisis_follow_ups
       SET status = 'COMPLETED', response = $1, completed_at = NOW()
       WHERE id = $2 AND status = 'PENDING'
       RETURNING id, user_id, crisis_event_id, scheduled_at, status, response, completed_at`,
      [response, followUpId],
    );

    if (result.rows.length === 0) {
      this.logger.warn(`Follow-up ${followUpId} not found or already completed`);
      return null as unknown as FollowUpCheckIn;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      crisisEventId: row.crisis_event_id,
      scheduledAt: row.scheduled_at,
      status: row.status,
      response: row.response,
      completedAt: row.completed_at,
    };
  }

  /**
   * Marks missed follow-ups. Called by a scheduled job (e.g., cron).
   * Any PENDING follow-up past its scheduled_at is marked MISSED and
   * triggers an escalation notification.
   */
  async processMissedFollowUps(): Promise<number> {
    const result = await this.pool.query(
      `UPDATE crisis_follow_ups
       SET status = 'MISSED'
       WHERE status = 'PENDING' AND scheduled_at < NOW()
       RETURNING id, user_id, crisis_event_id`,
    );

    for (const row of result.rows) {
      this.logger.warn(
        `MISSED follow-up for user ${row.user_id} — escalating`,
      );

      await this.pool.query(
        `INSERT INTO crisis_notifications (user_id, severity, category, matched_keywords, source, message, acknowledged)
         VALUES ($1, 'CRITICAL', 'CRISIS_UNSPECIFIED', '[]', 'SYSTEM', $2, false)`,
        [
          row.user_id,
          `Follow-up check-in missed for crisis event ${row.crisis_event_id}. Immediate review required.`,
        ],
      );
    }

    return result.rowCount ?? 0;
  }

  /**
   * Returns unacknowledged notifications for the safety team dashboard.
   */
  async getUnacknowledgedNotifications(): Promise<CrisisNotification[]> {
    const result = await this.pool.query(
      `SELECT id, user_id, severity, category, matched_keywords, source, message, created_at, acknowledged, acknowledged_by, acknowledged_at
       FROM crisis_notifications
       WHERE acknowledged = false
       ORDER BY
         CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 END,
         created_at ASC`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      severity: row.severity,
      category: row.category,
      matchedKeywords: JSON.parse(row.matched_keywords),
      source: row.source,
      message: row.message,
      timestamp: row.created_at,
      acknowledged: row.acknowledged,
      acknowledgedBy: row.acknowledged_by,
      acknowledgedAt: row.acknowledged_at,
    }));
  }

  /**
   * Acknowledges a notification (safety team member reviewed it).
   */
  async acknowledgeNotification(
    notificationId: string,
    acknowledgedBy: string,
  ): Promise<void> {
    await this.pool.query(
      `UPDATE crisis_notifications
       SET acknowledged = true, acknowledged_by = $1, acknowledged_at = NOW()
       WHERE id = $2`,
      [acknowledgedBy, notificationId],
    );
  }
}
