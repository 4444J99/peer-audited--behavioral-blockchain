import { Injectable, Logger } from "@nestjs/common";
import { Pool } from "pg";
import { CrisisDetectionResult } from "./crisis-detection.service";
import { CrisisNotificationService, CrisisNotification } from "./crisis-notification.service";

/**
 * CrisisInterventionService
 *
 * Provides immediate safety resources and logging for high-stress behavioral events.
 * Part of the Aegis Protocol's ethical guardrails.
 *
 * Upgraded: now integrates with CrisisNotificationService for safety team alerts
 * and follow-up protocols. CRITICAL events trigger immediate notifications;
 * HIGH events trigger 24h check-ins; MEDIUM events trigger 48h check-ins.
 */

export interface CrisisLog {
  userId: string;
  trigger: string;
  timestamp: string;
}

@Injectable()
export class CrisisInterventionService {
  private readonly logger = new Logger(CrisisInterventionService.name);

  constructor(
    private readonly pool: Pool,
    private readonly notifications: CrisisNotificationService,
  ) {}

  /**
   * Logs a crisis event, notifies the safety team, and schedules a follow-up.
   */
  async reportCrisis(
    userId: string,
    trigger: string,
    detection?: CrisisDetectionResult,
    source: CrisisNotification["source"] = "SELF_REPORT",
  ) {
    this.logger.warn(`CRISIS EVENT detected for user ${userId}: ${trigger}`);

    const severity = detection ? detection.severity : "HIGH";
    const matchedKeywords = detection
      ? JSON.stringify(detection.matchedKeywords)
      : "[]";
    const escalated = severity === "CRITICAL";

    const eventResult = await this.pool.query(
      `INSERT INTO crisis_events (user_id, trigger, severity, matched_keywords, escalated) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, trigger, severity, matchedKeywords, escalated],
    );
    const crisisEventId = eventResult.rows[0].id;

    // Notify safety team and schedule follow-up for any detected crisis
    if (detection && severity !== "NONE") {
      try {
        await this.notifications.notifySafetyTeam(
          userId,
          detection,
          source,
          trigger,
        );
        await this.notifications.scheduleFollowUp(
          userId,
          crisisEventId,
          severity as CrisisNotification["severity"],
        );
      } catch (err) {
        // Notification failure must not block the crisis response
        this.logger.error(`Failed to send crisis notification: ${err}`);
      }
    }

    return {
      message: "We've logged your distress signal. You are not alone.",
      resources: [
        {
          name: "Crisis Text Line",
          contact: "741741",
          instructions: "Text HOME to 741741",
        },
        {
          name: "National Suicide Prevention Lifeline",
          contact: "988",
          instructions: "Call or text 988",
        },
      ],
      actionTaken: escalated
        ? "The incident has been escalated to the safety team for immediate review."
        : "The incident has been recorded and is being reviewed.",
      escalated,
    };
  }
}
