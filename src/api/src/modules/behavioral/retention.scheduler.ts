import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import {
  DangerZoneService,
  DangerWindow,
  DangerWindowType,
  DEFAULT_TIMEZONE,
} from './danger-zone.service';
import { AccountabilityPartnerService, EscalationLevel } from './accountability-partner.service';
import {
  NotificationComposerService,
  NotificationType,
} from '../notifications/notification-composer.service';
import { NotificationsService } from '../notifications/notifications.service';

// The composer has no per-window types, so each danger window maps onto the
// closest composed notification: day-based windows onto the danger alert,
// the weekend window onto its dedicated warning, and the 2am window onto the
// crisis-resource prompt (impulse control is weakest late at night).
const WINDOW_EVENT_TYPE: Record<DangerWindowType, NotificationType> = {
  DAY_3: 'DANGER_ZONE_ALERT',
  DAY_21: 'DANGER_ZONE_ALERT',
  HIGH_STREAK_RISK: 'DANGER_ZONE_ALERT',
  WEEKEND: 'WEEKEND_WARNING',
  LATE_NIGHT: 'CRISIS_RESOURCE',
};

const ESCALATION_TITLES: Record<EscalationLevel, string> = {
  NOTIFY: 'Missed Partner Check-In',
  STAKE_WARNING: 'Stake Warning: Missed Check-Ins',
  CRISIS_TEAM: 'Safety Team Alerted',
};

@Injectable()
export class RetentionScheduler {
  private readonly logger = new Logger(RetentionScheduler.name);

  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly dangerZone: DangerZoneService,
    private readonly partners: AccountabilityPartnerService,
    private readonly composer: NotificationComposerService,
    @Optional() @Inject(NotificationsService)
    private readonly notifications?: NotificationsService,
  ) {}

  /**
   * Hourly: evaluate danger windows for every active recovery contract in the
   * owner's timezone and push a composed alert for each window entered.
   * Deduped via retention_notifications so a window fires at most once per
   * user/contract/local-day.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sweepDangerZones(): Promise<void> {
    const { rows } = await this.pool.query(
      `SELECT c.id AS contract_id, c.user_id, COALESCE(u.timezone, $1) AS timezone
       FROM contracts c
       JOIN users u ON u.id = c.user_id
       WHERE c.status = 'ACTIVE'
         AND c.oath_category LIKE 'RECOVERY_%'`,
      [DEFAULT_TIMEZONE],
    );

    for (const contract of rows) {
      try {
        const windows = await this.dangerZone.evaluateDangerWindows(
          contract.contract_id,
          contract.timezone,
        );
        if (windows.length === 0) continue;

        const day = await this.dangerZone.getContractDayNumber(contract.contract_id);
        for (const window of windows) {
          await this.fireDangerWindow(
            contract.user_id,
            contract.contract_id,
            contract.timezone,
            window,
            day,
          );
        }
      } catch (err) {
        this.logger.error(
          `Danger-zone sweep failed for contract ${contract.contract_id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  /**
   * Hourly: prompt contract owners for partner check-ins that are PENDING and
   * due per the partner service's scheduling data. One prompt per check-in per
   * local day.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendPartnerCheckInPrompts(): Promise<void> {
    if (!this.notifications) {
      this.logger.debug('[Retention] Notifications unavailable — skipping check-in prompts');
      return;
    }

    const { rows } = await this.pool.query(
      `SELECT pc.id AS checkin_id, pc.contract_id, pc.partner_id,
              c.user_id AS owner_id,
              COALESCE(uo.timezone, $1) AS owner_timezone,
              up.alias AS partner_alias
       FROM partner_checkins pc
       JOIN contracts c ON c.id = pc.contract_id
       JOIN users uo ON uo.id = c.user_id
       LEFT JOIN users up ON up.id = pc.partner_id
       WHERE pc.status = 'PENDING'
         AND pc.scheduled_at <= NOW()`,
      [DEFAULT_TIMEZONE],
    );

    for (const checkIn of rows) {
      try {
        const localDate = this.localDate(new Date(), checkIn.owner_timezone);
        const claim = await this.claimNotification(
          checkIn.owner_id,
          checkIn.contract_id,
          'PARTNER_CHECK_IN_PROMPT',
          checkIn.checkin_id,
          localDate,
        );
        if (!claim) continue;

        const composed = this.composer.compose({
          type: 'CHECK_IN_REMINDER',
          userId: checkIn.owner_id,
          contractId: checkIn.contract_id,
          metadata: {
            checkInId: checkIn.checkin_id,
            partnerAlias: checkIn.partner_alias ?? undefined,
          },
        });

        try {
          await this.notifications.create({
            userId: checkIn.owner_id,
            type: 'CHECK_IN_REMINDER',
            title: composed.title,
            body: composed.body,
            metadata: { ...composed.data, checkInId: checkIn.checkin_id, priority: composed.priority },
          });
          this.logger.log(
            `[Retention] Check-in prompt sent to user ${checkIn.owner_id} (check-in ${checkIn.checkin_id})`,
          );
        } catch (err) {
          await this.releaseClaim(claim);
          throw err;
        }
      } catch (err) {
        this.logger.error(
          `Check-in prompt failed for check-in ${checkIn.checkin_id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  /**
   * Daily at 00:30 UTC (after the attestation midnight pass): mark check-ins
   * that have been PENDING for more than 24 hours as MISSED and run the
   * partner service's escalation ladder for each.
   */
  @Cron('30 0 * * *')
  async escalateOverdueCheckIns(): Promise<void> {
    const missed = await this.pool.query(
      `UPDATE partner_checkins
       SET status = 'MISSED'
       WHERE status = 'PENDING'
         AND scheduled_at < NOW() - INTERVAL '24 hours'
       RETURNING id, contract_id, partner_id`,
    );
    if (missed.rows.length === 0) return;

    this.logger.log(`[Retention] Escalating ${missed.rows.length} overdue check-in(s)`);

    for (const row of missed.rows) {
      try {
        const { level, message } = await this.partners.escalateMissedCheckIn(row.id);
        if (!this.notifications) continue;

        const owner = await this.pool.query(
          `SELECT user_id FROM contracts WHERE id = $1`,
          [row.contract_id],
        );
        const ownerId = owner.rows[0]?.user_id;
        if (!ownerId) continue;

        await this.notifications.create({
          userId: ownerId,
          type: 'PARTNER_CHECKIN_ESCALATION',
          title: ESCALATION_TITLES[level],
          body: message,
          metadata: {
            checkInId: row.id,
            contractId: row.contract_id,
            partnerId: row.partner_id,
            level,
          },
        });
      } catch (err) {
        this.logger.error(
          `Escalation failed for check-in ${row.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  private async fireDangerWindow(
    userId: string,
    contractId: string,
    timezone: string,
    window: DangerWindow,
    day: number,
  ): Promise<void> {
    if (!this.notifications) {
      this.logger.debug(
        `[Retention] Would alert user ${userId} for ${window.type} on contract ${contractId}`,
      );
      return;
    }

    const localDate = this.localDate(new Date(), timezone);
    const claim = await this.claimNotification(
      userId,
      contractId,
      'DANGER_ZONE',
      window.type,
      localDate,
    );
    if (!claim) return; // already fired today for this window

    const eventType = WINDOW_EVENT_TYPE[window.type];
    const composed = this.composer.compose({
      type: eventType,
      userId,
      contractId,
      metadata: { day, window: window.type, severity: window.severity },
    });

    try {
      await this.notifications.create({
        userId,
        type: eventType,
        title: composed.title,
        body: composed.body,
        metadata: {
          ...composed.data,
          window: window.type,
          severity: window.severity,
          priority: composed.priority,
        },
      });
      this.logger.log(
        `[Retention] ${window.type} alert sent to user ${userId} (contract ${contractId})`,
      );
    } catch (err) {
      await this.releaseClaim(claim);
      throw err;
    }
  }

  /**
   * Claim-before-send: the unique constraint guarantees a mark is claimed at
   * most once per user/contract/type/key/local-day, even across overlapping
   * runs or multiple instances. Returns the claim row id, or null when
   * another run already claimed it.
   */
  private async claimNotification(
    userId: string,
    contractId: string,
    notificationType: string,
    dedupeKey: string,
    localDate: string,
  ): Promise<string | null> {
    const result = await this.pool.query(
      `INSERT INTO retention_notifications (user_id, contract_id, notification_type, dedupe_key, local_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, contract_id, notification_type, dedupe_key, local_date) DO NOTHING
       RETURNING id`,
      [userId, contractId, notificationType, dedupeKey, localDate],
    );
    return result.rows[0]?.id ?? null;
  }

  // Release a claimed dedupe mark after a failed delivery so the next hourly
  // run can retry instead of silently dropping the notification for the day.
  private async releaseClaim(claimId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM retention_notifications WHERE id = $1`,
      [claimId],
    );
  }

  // YYYY-MM-DD in the user's timezone; dedupe must roll over on the user's
  // midnight, not UTC's (late-night windows straddle the UTC date line).
  private localDate(at: Date, timeZone: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    try {
      return new Intl.DateTimeFormat('en-CA', { ...options, timeZone }).format(at);
    } catch {
      return new Intl.DateTimeFormat('en-CA', { ...options, timeZone: DEFAULT_TIMEZONE }).format(at);
    }
  }
}
