import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';

/**
 * SelfExclusionService
 * 
 * Implements the Aegis Protocol's safety guardrails for responsible use.
 * Allows users to voluntarily block themselves from the platform's 
 * financial and behavioral loops for a designated period.
 */

@Injectable()
export class SelfExclusionService {
  private readonly logger = new Logger(SelfExclusionService.name);

  constructor(private readonly pool: Pool) {}

  /**
   * Activates self-exclusion for a user.
   * This is an irreversible action for the duration of the period.
   */
  async activate(userId: string, durationDays: number): Promise<{ expiresAt: Date }> {
    if (durationDays < 1) throw new BadRequestException('Minimum exclusion is 1 day');
    if (durationDays > 365) throw new BadRequestException('Maximum self-exclusion is 1 year');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    await this.pool.query(
      `UPDATE users 
       SET self_exclusion_expires_at = $1, 
           status = 'SELF_EXCLUDED' 
       WHERE id = $2`,
      [expiresAt, userId]
    );

    this.logger.log(`User ${userId} self-excluded until ${expiresAt.toISOString()}`);
    return { expiresAt };
  }

  /**
   * Checks if a user is currently self-excluded.
   */
  async isExcluded(userId: string): Promise<{ excluded: boolean; expiresAt?: Date }> {
    const result = await this.pool.query(
      "SELECT self_exclusion_expires_at FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) return { excluded: false };

    const expiresAt = result.rows[0].self_exclusion_expires_at;
    if (!expiresAt) return { excluded: false };

    const isExcluded = new Date(expiresAt) > new Date();
    return { excluded: isExcluded, expiresAt: isExcluded ? new Date(expiresAt) : undefined };
  }
}
