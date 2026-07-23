import { Injectable } from '@nestjs/common';

export type NotificationType =
  | 'CHECK_IN_REMINDER'
  | 'DANGER_ZONE_ALERT'
  | 'MILESTONE_ACHIEVED'
  | 'PARTNER_CHECK_IN'
  | 'STREAK_MILESTONE'
  | 'WEEKEND_WARNING'
  | 'MISSED_PROOF'
  | 'CRISIS_RESOURCE';

export type NotificationPriority = 'low' | 'normal' | 'high';

export interface NotificationEvent {
  type: NotificationType;
  userId: string;
  contractId?: string;
  metadata?: Record<string, unknown>;
}

export interface ComposedNotification {
  title: string;
  body: string;
  data: Record<string, string>;
  priority: NotificationPriority;
}

@Injectable()
export class NotificationComposerService {
  compose(event: NotificationEvent): ComposedNotification {
    const metadata = event.metadata ?? {};

    let result: ComposedNotification;
    switch (event.type) {
      case 'CHECK_IN_REMINDER':
        result = this.composeCheckInReminder(metadata);
        break;
      case 'DANGER_ZONE_ALERT':
        result = this.composeDangerZoneAlert(metadata);
        break;
      case 'MILESTONE_ACHIEVED':
        result = this.composeMilestoneAchieved(metadata);
        break;
      case 'PARTNER_CHECK_IN':
        result = this.composePartnerCheckIn(metadata);
        break;
      case 'STREAK_MILESTONE':
        result = this.composeStreakMilestone(metadata);
        break;
      case 'WEEKEND_WARNING':
        result = this.composeWeekendWarning();
        break;
      case 'MISSED_PROOF':
        result = this.composeMissedProof();
        break;
      case 'CRISIS_RESOURCE':
        result = this.composeCrisisResource();
        break;
      default:
        throw new Error(`Unknown notification type: ${event.type}`);
    }

    return {
      ...result,
      data: {
        ...result.data,
        notificationType: event.type,
        userId: event.userId,
        ...(event.contractId ? { contractId: event.contractId } : {}),
      },
    };
  }

  composeCheckInReminder(metadata: Record<string, unknown>): ComposedNotification {
    return {
      title: 'Daily Check-In',
      body: 'Time for your daily check-in. Your partner is waiting.',
      data: { notificationType: 'CHECK_IN_REMINDER' },
      priority: 'normal',
    };
  }

  composeDangerZoneAlert(metadata: Record<string, unknown>): ComposedNotification {
    const day = metadata.day ?? 1;
    return {
      title: 'Danger Zone',
      body: `Day ${day}: The first 72 hours are the hardest. You're not alone.`,
      data: { notificationType: 'DANGER_ZONE_ALERT' },
      priority: 'high',
    };
  }

  composeMilestoneAchieved(metadata: Record<string, unknown>): ComposedNotification {
    const milestone = metadata.milestone ?? 'Achievement';
    return {
      title: 'Milestone Reached',
      body: `${milestone} — you're making real progress. Keep going.`,
      data: { notificationType: 'MILESTONE_ACHIEVED' },
      priority: 'normal',
    };
  }

  composePartnerCheckIn(metadata: Record<string, unknown>): ComposedNotification {
    const partnerAlias = metadata.partnerAlias ?? 'Your partner';
    return {
      title: 'Partner Check-In',
      body: `${partnerAlias} sent you a check-in`,
      data: { notificationType: 'PARTNER_CHECK_IN' },
      priority: 'normal',
    };
  }

  composeStreakMilestone(metadata: Record<string, unknown>): ComposedNotification {
    const streak = metadata.streak ?? 1;
    return {
      title: 'Streak Milestone',
      body: `${streak} days strong. You're proving something to yourself.`,
      data: { notificationType: 'STREAK_MILESTONE' },
      priority: 'normal',
    };
  }

  composeWeekendWarning(): ComposedNotification {
    return {
      title: 'Weekend Ahead',
      body: 'Weekend ahead. Pre-commit your routine. We\'re here.',
      data: { notificationType: 'WEEKEND_WARNING' },
      priority: 'normal',
    };
  }

  composeMissedProof(): ComposedNotification {
    return {
      title: 'Missed Proof',
      body: 'You missed your proof window. Get back on track — one slip doesn\'t define you.',
      data: { notificationType: 'MISSED_PROOF' },
      priority: 'normal',
    };
  }

  composeCrisisResource(): ComposedNotification {
    return {
      title: 'Support Available',
      body: 'If you\'re in crisis, help is available 24/7. Tap for resources.',
      data: { notificationType: 'CRISIS_RESOURCE' },
      priority: 'high',
    };
  }
}
