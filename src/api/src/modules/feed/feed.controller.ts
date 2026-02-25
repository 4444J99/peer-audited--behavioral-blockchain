import { Controller, Get, Query, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Pool } from 'pg';
import { Observable, interval, map, startWith, switchMap, from } from 'rxjs';

/**
 * FeedController — Anonymized public activity feed.
 * Provides social proof and FOMO dynamics to drive engagement.
 * No authentication required — fully public for spectators.
 */
@ApiTags('Feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly pool: Pool) {}

  /**
   * Anonymize a user identifier for public display.
   * Uses first 4 chars of the user ID — never shows email or full ID.
   */
  private anonymize(userId: string): string {
    return `styx_${userId.slice(0, 4)}`;
  }

  @Get()
  @ApiOperation({ summary: 'Get anonymized public activity feed' })
  async getFeed(@Query('limit') limit?: string) {
    const max = Math.min(Number(limit) || 20, 50);

    const result = await this.pool.query(
      `SELECT el.event_type, el.payload, el.created_at, el.actor_id
       FROM event_log el
       WHERE el.event_type IN (
         'PROOF_VERIFIED', 'CONTRACT_COMPLETED', 'CONTRACT_FAILED',
         'FURY_BOUNTY_PAID', 'APPEAL_INITIATED', 'DISPUTE_RESOLVED',
         'HONEYPOT_CAUGHT', 'STREAK_MILESTONE'
       )
       ORDER BY el.created_at DESC
       LIMIT $1`,
      [max],
    );

    const events = result.rows.map((row: any) => ({
      id: `evt_${row.created_at.getTime()}`,
      type: row.event_type,
      message: this.formatEventMessage(row.event_type, row.actor_id, row.payload),
      timestamp: row.created_at,
    }));

    return { events };
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Real-time SSE stream of anonymized events' })
  streamEvents(): Observable<MessageEvent> {
    // Poll every 5 seconds for new events
    return interval(5000).pipe(
      startWith(0),
      switchMap(() =>
        from(
          this.pool.query(
            `SELECT el.event_type, el.payload, el.created_at, el.actor_id
             FROM event_log el
             WHERE el.created_at > NOW() - INTERVAL '30 seconds'
             AND el.event_type IN (
               'PROOF_VERIFIED', 'CONTRACT_COMPLETED', 'CONTRACT_FAILED',
               'FURY_BOUNTY_PAID', 'APPEAL_INITIATED', 'DISPUTE_RESOLVED'
             )
             ORDER BY el.created_at DESC
             LIMIT 5`,
          ),
        ),
      ),
      map((result: any) => {
        const events = result.rows.map((row: any) => ({
          id: `evt_${row.created_at.getTime()}`,
          type: row.event_type,
          message: this.formatEventMessage(row.event_type, row.actor_id, row.payload),
          timestamp: row.created_at,
        }));
        return { data: JSON.stringify({ events }) } as MessageEvent;
      }),
    );
  }

  private formatEventMessage(eventType: string, actorId: string | null, payload: any): string {
    const actor = actorId ? this.anonymize(actorId) : 'System';

    switch (eventType) {
      case 'PROOF_VERIFIED':
        return `${actor} submitted proof that was verified by peer review`;
      case 'CONTRACT_COMPLETED':
        return `${actor} completed a ${payload?.oathCategory || 'behavioral'} contract 🏆`;
      case 'CONTRACT_FAILED':
        return `${actor} failed a behavioral contract — stake forfeited`;
      case 'FURY_BOUNTY_PAID':
        return `${actor} earned a Fury bounty for accurate review`;
      case 'APPEAL_INITIATED':
        return `${actor} appealed a verdict — The Judge will decide`;
      case 'DISPUTE_RESOLVED':
        return `A dispute was ${payload?.outcome?.toLowerCase() || 'resolved'} by The Judge ⚖️`;
      case 'HONEYPOT_CAUGHT':
        return `${actor} correctly identified a calibration proof 🎯`;
      case 'STREAK_MILESTONE':
        return `${actor} hit a ${payload?.days || '?'}-day streak 🔥`;
      default:
        return `${actor} triggered an event`;
    }
  }
}
