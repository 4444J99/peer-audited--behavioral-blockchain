import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

export interface PartnerMatch {
  partnerId: string;
  alias: string;
  sharedCategories: string[];
  mutualInterestScore: number;
}

export interface CheckIn {
  id: string;
  contractId: string;
  partnerId: string;
  type: 'SCHEDULED' | 'EMERGENCY' | 'STREAK_MILESTONE';
  status: 'PENDING' | 'COMPLETED' | 'MISSED' | 'ESCALATED';
  scheduledAt: Date;
  completedAt?: Date;
  message?: string;
}

export type EscalationLevel = 'NOTIFY' | 'STAKE_WARNING' | 'CRISIS_TEAM';

@Injectable()
export class AccountabilityPartnerService {
  private readonly logger = new Logger(AccountabilityPartnerService.name);

  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
  ) {}

  async requestPartnerMatch(userId: string, categories: string[]): Promise<PartnerMatch> {
    const { rows } = await this.pool.query(
      `SELECT u.id, u.alias, u.oath_categories
       FROM users u
       WHERE u.id != $1
         AND u.oath_categories && $2
       ORDER BY array_length(u.oath_categories & $2, 1) DESC
       LIMIT 1`,
      [userId, categories],
    );

    if (rows.length === 0) {
      return {
        partnerId: `partner-${userId.slice(0, 8)}`,
        alias: `partner-${userId.slice(0, 8)}`,
        sharedCategories: categories,
        mutualInterestScore: 0,
      };
    }

    const row = rows[0];
    const sharedCategories = categories.filter((c) =>
      row.oath_categories.includes(c),
    );

    return {
      partnerId: row.id,
      alias: row.alias ?? `user-${row.id.slice(0, 8)}`,
      sharedCategories,
      mutualInterestScore: sharedCategories.length / categories.length,
    };
  }

  async scheduleCheckIn(
    contractId: string,
    partnerId: string,
    type: CheckIn['type'],
  ): Promise<CheckIn> {
    const id = randomUUID();
    const { rows } = await this.pool.query(
      `INSERT INTO partner_checkins (id, contract_id, partner_id, type, status, scheduled_at)
       VALUES ($1, $2, $3, $4, 'PENDING', NOW())
       RETURNING id, contract_id, partner_id, type, status, scheduled_at, completed_at, message`,
      [id, contractId, partnerId, type],
    );

    const row = rows[0];
    return {
      id: row.id,
      contractId: row.contract_id,
      partnerId: row.partner_id,
      type: row.type,
      status: row.status,
      scheduledAt: row.scheduled_at,
      completedAt: row.completed_at ?? undefined,
      message: row.message ?? undefined,
    };
  }

  async completeCheckIn(checkInId: string, message: string): Promise<CheckIn> {
    const { rows } = await this.pool.query(
      `UPDATE partner_checkins
       SET status = 'COMPLETED', completed_at = NOW(), message = $2
       WHERE id = $1
       RETURNING id, contract_id, partner_id, type, status, scheduled_at, completed_at, message`,
      [checkInId, message],
    );

    if (rows.length === 0) {
      throw new Error(`Check-in ${checkInId} not found`);
    }

    const row = rows[0];
    return {
      id: row.id,
      contractId: row.contract_id,
      partnerId: row.partner_id,
      type: row.type,
      status: row.status,
      scheduledAt: row.scheduled_at,
      completedAt: row.completed_at ?? undefined,
      message: row.message ?? undefined,
    };
  }

  async escalateMissedCheckIn(
    checkInId: string,
  ): Promise<{ level: EscalationLevel; message: string }> {
    const { rows: checkInRows } = await this.pool.query(
      `SELECT contract_id, partner_id FROM partner_checkins WHERE id = $1`,
      [checkInId],
    );

    if (checkInRows.length === 0) {
      throw new Error(`Check-in ${checkInId} not found`);
    }

    const { contract_id: contractId, partner_id: partnerId } = checkInRows[0];

    const { rows: consecutiveRows } = await this.pool.query(
      `SELECT COUNT(*)::int AS consecutive_misses
       FROM (
         SELECT id, status,
                ROW_NUMBER() OVER (ORDER BY scheduled_at DESC) AS rn
         FROM partner_checkins
         WHERE contract_id = $1 AND partner_id = $2
       ) sub
       WHERE sub.status = 'MISSED' AND sub.rn <= (
         SELECT COUNT(*)::int FROM partner_checkins
         WHERE contract_id = $1 AND partner_id = $2 AND status = 'MISSED'
       )`,
      [contractId, partnerId],
    );

    const consecutiveMisses = consecutiveRows[0]?.consecutive_misses ?? 0;

    let level: EscalationLevel;
    let message: string;

    if (consecutiveMisses >= 3) {
      level = 'CRISIS_TEAM';
      message = `Safety team alerted: ${consecutiveMisses} consecutive missed check-ins for contract ${contractId}`;
    } else if (consecutiveMisses === 2) {
      level = 'STAKE_WARNING';
      message = `Stake warning issued: partner ${partnerId} missed 2 consecutive check-ins on contract ${contractId}`;
    } else {
      level = 'NOTIFY';
      message = `Soft reminder sent to partner ${partnerId} for missed check-in on contract ${contractId}`;
    }

    await this.pool.query(
      `UPDATE partner_checkins SET status = 'ESCALATED' WHERE id = $1`,
      [checkInId],
    );

    this.logger.log(`Escalated check-in ${checkInId} to level ${level}`);
    return { level, message };
  }

  async getActivePartnerships(userId: string): Promise<PartnerMatch[]> {
    const { rows } = await this.pool.query(
      `SELECT DISTINCT u.id AS partner_id, u.alias, u.oath_categories
       FROM partner_checkins pc
       JOIN contracts c ON c.id = pc.contract_id
       JOIN users u ON u.id = pc.partner_id
       WHERE c.user_id = $1
         AND pc.status IN ('PENDING', 'COMPLETED')`,
      [userId],
    );

    return rows.map((row) => ({
      partnerId: row.partner_id,
      alias: row.alias ?? `user-${row.partner_id.slice(0, 8)}`,
      sharedCategories: row.oath_categories ?? [],
      mutualInterestScore: 1,
    }));
  }

  async getCheckInHistory(
    contractId: string,
    limit: number = 20,
  ): Promise<CheckIn[]> {
    const { rows } = await this.pool.query(
      `SELECT id, contract_id, partner_id, type, status, scheduled_at, completed_at, message
       FROM partner_checkins
       WHERE contract_id = $1
       ORDER BY scheduled_at DESC
       LIMIT $2`,
      [contractId, limit],
    );

    return rows.map((row) => ({
      id: row.id,
      contractId: row.contract_id,
      partnerId: row.partner_id,
      type: row.type,
      status: row.status,
      scheduledAt: row.scheduled_at,
      completedAt: row.completed_at ?? undefined,
      message: row.message ?? undefined,
    }));
  }
}
