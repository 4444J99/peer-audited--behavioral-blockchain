import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

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
  private readonly notificationSubject = new Subject<Notification>();

  constructor(private readonly pool: Pool) {}

  /**
   * Returns an observable stream of notifications filtered for a specific user.
   */
  getStreamForUser(userId: string): Observable<MessageEvent> {
    return this.notificationSubject.asObservable().pipe(
      filter((n) => n.user_id === userId),
      map((n) => ({ data: n } as MessageEvent)),
    );
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const result = await this.pool.query(
      `INSERT INTO notifications (user_id, type, title, body, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [dto.userId, dto.type, dto.title, dto.body ?? null, dto.metadata ? JSON.stringify(dto.metadata) : null],
    );
    const notification = result.rows[0];

    // Emit to SSE subscribers
    this.notificationSubject.next(notification);

    return notification;
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

  /**
   * F-AEGIS-08: RAIN Mindfulness Notification
   * Triggers a specialized mindfulness intercession sequence.
   */
  async createRainNotification(userId: string, contractId: string, reason: string): Promise<Notification> {
    return this.create({
      userId,
      type: 'RAIN_INTERCESSION',
      title: 'Take a Breath: RAIN Protocol',
      body: 'You missed a check-in. Before proceeding, use RAIN: Recognize the urge, Allow it to be there, Investigate the feeling, Note the experience.',
      metadata: { contractId, reason, protocol: 'RAIN' },
    });
  }

  /**
   * Returns anonymized public feed events from the event_log.
   * Strips all PII — returns only event types and anonymized descriptions.
   */
  async getPublicFeed(limit: number = 50): Promise<{ events: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }> }> {
    const result = await this.pool.query(
      `SELECT id, event_type, payload, created_at
       FROM event_log
       WHERE event_type IN (
         'CONTRACT_CREATED', 'CONTRACT_RESOLVED', 'PROOF_SUBMITTED',
         'CONSENSUS_REACHED', 'FURY_VERDICT', 'HONEYPOT_DETECTED',
         'FURY_BOUNTY_PAID', 'FURY_PENALTY_CHARGED'
       )
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    );

    const events = result.rows.map((row) => ({
      id: row.id,
      type: this.mapEventType(row.event_type),
      message: this.anonymizeEvent(row.event_type, row.payload),
      timestamp: row.created_at,
    }));

    return { events };
  }

  private mapEventType(eventType: string): string {
    const map: Record<string, string> = {
      CONTRACT_CREATED: 'contract_created',
      CONTRACT_RESOLVED: 'contract_completed',
      PROOF_SUBMITTED: 'contract_created',
      CONSENSUS_REACHED: 'fury_catch',
      FURY_VERDICT: 'fury_catch',
      HONEYPOT_DETECTED: 'honeypot_test',
      FURY_BOUNTY_PAID: 'bounty_paid',
      FURY_PENALTY_CHARGED: 'penalty_charged',
    };
    return map[eventType] || 'milestone';
  }

  private anonymizeEvent(eventType: string, payload: Record<string, unknown>): string {
    const amount = payload?.stakeAmount || payload?.amount;
    const category = payload?.oathCategory
      ? String(payload.oathCategory).replace(/_/g, ' ').toLowerCase()
      : 'behavioral';
    const duration = payload?.durationDays;

    switch (eventType) {
      case 'CONTRACT_CREATED':
        return `Someone committed ${amount ? `$${amount}` : 'capital'} to a ${duration ? `${duration}-day` : ''} ${category} oath`;
      case 'CONTRACT_RESOLVED': {
        const outcome = payload?.outcome;
        if (outcome === 'COMPLETED') {
          return `A ${category} oath was successfully completed${amount ? `. $${amount} returned.` : '.'}`;
        }
        return `A ${category} oath was not fulfilled${amount ? `. $${amount} captured and redistributed.` : '.'}`;
      }
      case 'CONSENSUS_REACHED':
        return `Fury consensus reached on a proof review`;
      case 'FURY_VERDICT': {
        const verdict = payload?.verdict;
        if (verdict === 'FAIL') {
          return `A Fury caught a fraudulent proof and earned a bounty`;
        }
        return `A Fury verified a proof submission`;
      }
      case 'HONEYPOT_DETECTED':
        return `System honeypot test completed — auditor integrity validated`;
      case 'FURY_BOUNTY_PAID': {
        const bountyAmount = payload?.amount;
        return `A Fury earned a $${bountyAmount || '2.00'} bounty for a correct audit`;
      }
      case 'FURY_PENALTY_CHARGED': {
        const penaltyAmount = payload?.amount;
        const reason = payload?.reason === 'honeypot_failure' ? 'failing a honeypot test' : 'an incorrect audit';
        return `A Fury was charged a $${penaltyAmount || '2.00'} penalty for ${reason}`;
      }
      default:
        return `System event recorded`;
    }
  }
}
