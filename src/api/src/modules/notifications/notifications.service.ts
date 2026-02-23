import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly pool: Pool) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const result = await this.pool.query(
      `INSERT INTO notifications (user_id, type, title, body, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [dto.userId, dto.type, dto.title, dto.body ?? null, dto.metadata ? JSON.stringify(dto.metadata) : null],
    );
    return result.rows[0];
  }

  async getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    const result = await this.pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2`,
      [notificationId, userId],
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE`,
      [userId],
    );
    return Number(result.rows[0].count);
  }
}
