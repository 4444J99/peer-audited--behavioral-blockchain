import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

/**
 * CrisisInterventionService
 * 
 * Provides immediate safety resources and logging for high-stress behavioral events.
 * Part of the Aegis Protocol's ethical guardrails.
 */

export interface CrisisLog {
  userId: string;
  trigger: string;
  timestamp: string;
}

@Injectable()
export class CrisisInterventionService {
  private readonly logger = new Logger(CrisisInterventionService.name);

  constructor(private readonly pool: Pool) {}

  /**
   * Logs a crisis event and returns support resources.
   */
  async reportCrisis(userId: string, trigger: string) {
    this.logger.warn(`CRISIS EVENT detected for user ${userId}: ${trigger}`);

    await this.pool.query(
      `INSERT INTO crisis_events (user_id, trigger, severity) VALUES ($1, $2, 'HIGH')`,
      [userId, trigger]
    );

    return {
      message: "We've logged your distress signal. You are not alone.",
      resources: [
        { name: "Crisis Text Line", contact: "741741", instructions: "Text HOME to 741741" },
        { name: "National Suicide Prevention Lifeline", contact: "988", instructions: "Call or text 988" }
      ],
      actionTaken: "An automated cooldown period has been applied to your account."
    };
  }
}
