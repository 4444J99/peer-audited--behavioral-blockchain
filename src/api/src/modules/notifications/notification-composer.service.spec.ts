import { NotificationComposerService } from './notification-composer.service';

describe('NotificationComposerService', () => {
  let service: NotificationComposerService;

  beforeEach(() => {
    service = new NotificationComposerService();
  });

  describe('compose', () => {
    it('routes to composeCheckInReminder', () => {
      const result = service.compose({ type: 'CHECK_IN_REMINDER', userId: 'u1' });
      expect(result.title).toBe('Daily Check-In');
      expect(result.body).toBe('Time for your daily check-in. Your partner is waiting.');
    });

    it('routes to composeDangerZoneAlert', () => {
      const result = service.compose({ type: 'DANGER_ZONE_ALERT', userId: 'u1', metadata: { day: 3 } });
      expect(result.title).toBe('Danger Zone');
      expect(result.body).toContain('Day 3');
    });

    it('routes to composeMilestoneAchieved', () => {
      const result = service.compose({ type: 'MILESTONE_ACHIEVED', userId: 'u1', metadata: { milestone: 'First Week' } });
      expect(result.title).toBe('Milestone Reached');
      expect(result.body).toContain('First Week');
    });

    it('routes to composePartnerCheckIn', () => {
      const result = service.compose({ type: 'PARTNER_CHECK_IN', userId: 'u1', metadata: { partnerAlias: 'Alex' } });
      expect(result.title).toBe('Partner Check-In');
      expect(result.body).toBe('Alex sent you a check-in');
    });

    it('routes to composeStreakMilestone', () => {
      const result = service.compose({ type: 'STREAK_MILESTONE', userId: 'u1', metadata: { streak: 14 } });
      expect(result.title).toBe('Streak Milestone');
      expect(result.body).toBe('14 days strong. You\'re proving something to yourself.');
    });

    it('routes to composeWeekendWarning', () => {
      const result = service.compose({ type: 'WEEKEND_WARNING', userId: 'u1' });
      expect(result.title).toBe('Weekend Ahead');
      expect(result.body).toBe('Weekend ahead. Pre-commit your routine. We\'re here.');
    });

    it('routes to composeMissedProof', () => {
      const result = service.compose({ type: 'MISSED_PROOF', userId: 'u1' });
      expect(result.title).toBe('Missed Proof');
      expect(result.body).toContain('missed your proof window');
    });

    it('routes to composeCrisisResource', () => {
      const result = service.compose({ type: 'CRISIS_RESOURCE', userId: 'u1' });
      expect(result.title).toBe('Support Available');
      expect(result.body).toContain('crisis');
    });

    it('throws on unknown type', () => {
      expect(() => service.compose({ type: 'UNKNOWN' as any, userId: 'u1' })).toThrow('Unknown notification type');
    });

    it('includes notificationType and userId in data', () => {
      const result = service.compose({ type: 'CHECK_IN_REMINDER', userId: 'u1' });
      expect(result.data.notificationType).toBe('CHECK_IN_REMINDER');
      expect(result.data.userId).toBe('u1');
    });

    it('includes contractId in data when provided', () => {
      const result = service.compose({ type: 'CHECK_IN_REMINDER', userId: 'u1', contractId: 'c-42' });
      expect(result.data.contractId).toBe('c-42');
    });

    it('does not include contractId in data when absent', () => {
      const result = service.compose({ type: 'CHECK_IN_REMINDER', userId: 'u1' });
      expect(result.data.contractId).toBeUndefined();
    });
  });

  describe('priority', () => {
    it('returns high for CRISIS_RESOURCE', () => {
      const result = service.composeCrisisResource();
      expect(result.priority).toBe('high');
    });

    it('returns high for DANGER_ZONE_ALERT', () => {
      const result = service.composeDangerZoneAlert({ day: 1 });
      expect(result.priority).toBe('high');
    });

    it('returns normal for all other types', () => {
      expect(service.composeCheckInReminder({}).priority).toBe('normal');
      expect(service.composeMilestoneAchieved({}).priority).toBe('normal');
      expect(service.composePartnerCheckIn({}).priority).toBe('normal');
      expect(service.composeStreakMilestone({}).priority).toBe('normal');
      expect(service.composeWeekendWarning().priority).toBe('normal');
      expect(service.composeMissedProof().priority).toBe('normal');
    });
  });

  describe('metadata interpolation', () => {
    it('interpolates day in danger zone alert', () => {
      const result = service.composeDangerZoneAlert({ day: 5 });
      expect(result.body).toBe('Day 5: The first 72 hours are the hardest. You\'re not alone.');
    });

    it('defaults day to 1 when missing', () => {
      const result = service.composeDangerZoneAlert({});
      expect(result.body).toBe('Day 1: The first 72 hours are the hardest. You\'re not alone.');
    });

    it('interpolates milestone title', () => {
      const result = service.composeMilestoneAchieved({ milestone: '30-Day Champion' });
      expect(result.body).toContain('30-Day Champion');
    });

    it('defaults milestone to Achievement', () => {
      const result = service.composeMilestoneAchieved({});
      expect(result.body).toContain('Achievement');
    });

    it('interpolates partnerAlias', () => {
      const result = service.composePartnerCheckIn({ partnerAlias: 'Jordan' });
      expect(result.body).toBe('Jordan sent you a check-in');
    });

    it('defaults partnerAlias to Your partner', () => {
      const result = service.composePartnerCheckIn({});
      expect(result.body).toBe('Your partner sent you a check-in');
    });

    it('interpolates streak count', () => {
      const result = service.composeStreakMilestone({ streak: 7 });
      expect(result.body).toBe('7 days strong. You\'re proving something to yourself.');
    });

    it('defaults streak to 1', () => {
      const result = service.composeStreakMilestone({});
      expect(result.body).toBe('1 days strong. You\'re proving something to yourself.');
    });
  });

  describe('compose standalone methods', () => {
    it('composeCheckInReminder returns expected content', () => {
      const result = service.composeCheckInReminder({});
      expect(result.title).toBe('Daily Check-In');
      expect(result.body).toBe('Time for your daily check-in. Your partner is waiting.');
      expect(result.data.notificationType).toBe('CHECK_IN_REMINDER');
    });

    it('composeWeekendWarning returns expected content', () => {
      const result = service.composeWeekendWarning();
      expect(result.title).toBe('Weekend Ahead');
      expect(result.body).toBe('Weekend ahead. Pre-commit your routine. We\'re here.');
      expect(result.data.notificationType).toBe('WEEKEND_WARNING');
    });

    it('composeMissedProof returns expected content', () => {
      const result = service.composeMissedProof();
      expect(result.title).toBe('Missed Proof');
      expect(result.body).toBe('You missed your proof window. Get back on track — one slip doesn\'t define you.');
      expect(result.data.notificationType).toBe('MISSED_PROOF');
    });

    it('composeCrisisResource returns expected content', () => {
      const result = service.composeCrisisResource();
      expect(result.title).toBe('Support Available');
      expect(result.body).toBe('If you\'re in crisis, help is available 24/7. Tap for resources.');
      expect(result.data.notificationType).toBe('CRISIS_RESOURCE');
    });
  });
});
