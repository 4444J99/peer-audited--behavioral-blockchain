import { RetentionScheduler } from './retention.scheduler';
import { NotificationComposerService } from '../notifications/notification-composer.service';

describe('RetentionScheduler', () => {
  let scheduler: RetentionScheduler;
  let pool: { query: jest.Mock };
  let danger: { evaluateDangerWindows: jest.Mock; getContractDayNumber: jest.Mock };
  let partners: { escalateMissedCheckIn: jest.Mock };
  let notifications: { create: jest.Mock };

  const build = (withNotifications = true) =>
    new RetentionScheduler(
      pool as any,
      danger as any,
      partners as any,
      new NotificationComposerService(),
      withNotifications ? (notifications as any) : undefined,
    );

  beforeEach(() => {
    pool = { query: jest.fn() };
    danger = { evaluateDangerWindows: jest.fn(), getContractDayNumber: jest.fn() };
    partners = { escalateMissedCheckIn: jest.fn() };
    notifications = { create: jest.fn().mockResolvedValue({}) };
    scheduler = build();
  });

  const claimCalls = () =>
    pool.query.mock.calls.filter(([sql]) => String(sql).includes('INSERT INTO retention_notifications'));

  describe('sweepDangerZones', () => {
    const contractRow = { contract_id: 'c-1', user_id: 'u-1', timezone: 'America/New_York' };

    it('fires a composed push per window entered, in the user timezone', async () => {
      pool.query
        // active recovery contracts
        .mockResolvedValueOnce({ rows: [contractRow] })
        // claim for DAY_3
        .mockResolvedValueOnce({ rows: [{ id: 'rn-1' }] })
        // claim for WEEKEND
        .mockResolvedValueOnce({ rows: [{ id: 'rn-2' }] });
      danger.evaluateDangerWindows.mockResolvedValueOnce([
        { type: 'DAY_3', severity: 'HIGH', message: 'The critical first 72 hours' },
        { type: 'WEEKEND', severity: 'MEDIUM', message: 'Weekend vulnerability window' },
      ]);
      danger.getContractDayNumber.mockResolvedValueOnce(3);

      await scheduler.sweepDangerZones();

      expect(danger.evaluateDangerWindows).toHaveBeenCalledWith('c-1', 'America/New_York');
      expect(notifications.create).toHaveBeenCalledTimes(2);
      expect(notifications.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
        userId: 'u-1',
        type: 'DANGER_ZONE_ALERT',
        title: 'Danger Zone',
        body: "Day 3: The first 72 hours are the hardest. You're not alone.",
        metadata: expect.objectContaining({ window: 'DAY_3', severity: 'HIGH', contractId: 'c-1' }),
      }));
      expect(notifications.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
        userId: 'u-1',
        type: 'WEEKEND_WARNING',
        metadata: expect.objectContaining({ window: 'WEEKEND' }),
      }));
      expect(claimCalls()[0][1]).toEqual(['u-1', 'c-1', 'DANGER_ZONE', 'DAY_3', expect.anything()]);
      expect(claimCalls()[0][1][4]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('maps LATE_NIGHT onto the crisis-resource push', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [contractRow] })
        .mockResolvedValueOnce({ rows: [{ id: 'rn-1' }] });
      danger.evaluateDangerWindows.mockResolvedValueOnce([
        { type: 'LATE_NIGHT', severity: 'HIGH', message: 'Late-night high-risk window' },
      ]);
      danger.getContractDayNumber.mockResolvedValueOnce(10);

      await scheduler.sweepDangerZones();

      expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'CRISIS_RESOURCE',
        title: 'Support Available',
        metadata: expect.objectContaining({ window: 'LATE_NIGHT', priority: 'high' }),
      }));
    });

    it('dedupes: a window already claimed today does not fire again', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [contractRow] })
        // conflict — someone already claimed this window today
        .mockResolvedValueOnce({ rows: [] });
      danger.evaluateDangerWindows.mockResolvedValueOnce([
        { type: 'DAY_21', severity: 'CRITICAL', message: 'The extinction burst' },
      ]);
      danger.getContractDayNumber.mockResolvedValueOnce(21);

      await scheduler.sweepDangerZones();

      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('does not claim or fetch day numbers for contracts with no active windows', async () => {
      pool.query.mockResolvedValueOnce({ rows: [contractRow] });
      danger.evaluateDangerWindows.mockResolvedValueOnce([]);

      await scheduler.sweepDangerZones();

      expect(danger.getContractDayNumber).not.toHaveBeenCalled();
      expect(claimCalls()).toHaveLength(0);
      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('releases the dedupe claim when delivery fails so the next run can retry', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [contractRow] })
        .mockResolvedValueOnce({ rows: [{ id: 'rn-1' }] })
        // DELETE releasing the claim
        .mockResolvedValueOnce({ rows: [] });
      danger.evaluateDangerWindows.mockResolvedValueOnce([
        { type: 'DAY_3', severity: 'HIGH', message: 'The critical first 72 hours' },
      ]);
      danger.getContractDayNumber.mockResolvedValueOnce(3);
      notifications.create.mockRejectedValueOnce(new Error('push provider down'));

      await scheduler.sweepDangerZones();

      const deleteCall = pool.query.mock.calls.find(([sql]) =>
        String(sql).includes('DELETE FROM retention_notifications'),
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall![1]).toEqual(['rn-1']);
    });

    it('evaluates but never claims when the notification service is absent', async () => {
      const bare = build(false);
      pool.query.mockResolvedValueOnce({ rows: [contractRow] });
      danger.evaluateDangerWindows.mockResolvedValueOnce([
        { type: 'DAY_3', severity: 'HIGH', message: 'The critical first 72 hours' },
      ]);
      danger.getContractDayNumber.mockResolvedValueOnce(3);

      await bare.sweepDangerZones();

      expect(claimCalls()).toHaveLength(0);
    });

    it('continues sweeping after one contract fails', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [contractRow, { contract_id: 'c-2', user_id: 'u-2', timezone: 'UTC' }],
        })
        .mockResolvedValueOnce({ rows: [{ id: 'rn-1' }] });
      danger.evaluateDangerWindows
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce([
          { type: 'DAY_3', severity: 'HIGH', message: 'The critical first 72 hours' },
        ]);
      danger.getContractDayNumber.mockResolvedValueOnce(2);

      await scheduler.sweepDangerZones();

      expect(notifications.create).toHaveBeenCalledTimes(1);
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u-2' }),
      );
    });
  });

  describe('sendPartnerCheckInPrompts', () => {
    const pendingRow = {
      checkin_id: 'chk-1',
      contract_id: 'c-1',
      partner_id: 'p-1',
      owner_id: 'u-1',
      owner_timezone: 'America/New_York',
      partner_alias: 'alpha',
    };

    it('prompts the contract owner for each due pending check-in', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [pendingRow] })
        .mockResolvedValueOnce({ rows: [{ id: 'rn-1' }] });

      await scheduler.sendPartnerCheckInPrompts();

      expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'u-1',
        type: 'CHECK_IN_REMINDER',
        title: 'Daily Check-In',
        body: 'Time for your daily check-in. Your partner is waiting.',
        metadata: expect.objectContaining({ checkInId: 'chk-1' }),
      }));
      expect(claimCalls()[0][1]).toEqual([
        'u-1', 'c-1', 'PARTNER_CHECK_IN_PROMPT', 'chk-1', expect.anything(),
      ]);
    });

    it('dedupes prompts already sent today for the same check-in', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [pendingRow] })
        .mockResolvedValueOnce({ rows: [] });

      await scheduler.sendPartnerCheckInPrompts();

      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('releases the claim when the prompt fails to send', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [pendingRow] })
        .mockResolvedValueOnce({ rows: [{ id: 'rn-9' }] })
        .mockResolvedValueOnce({ rows: [] });
      notifications.create.mockRejectedValueOnce(new Error('queue down'));

      await scheduler.sendPartnerCheckInPrompts();

      const deleteCall = pool.query.mock.calls.find(([sql]) =>
        String(sql).includes('DELETE FROM retention_notifications'),
      );
      expect(deleteCall![1]).toEqual(['rn-9']);
    });

    it('skips entirely when the notification service is absent', async () => {
      const bare = build(false);

      await bare.sendPartnerCheckInPrompts();

      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('escalateOverdueCheckIns', () => {
    it('does nothing when no check-ins are overdue', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await scheduler.escalateOverdueCheckIns();

      expect(partners.escalateMissedCheckIn).not.toHaveBeenCalled();
      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('marks overdue check-ins MISSED, escalates, and notifies the owner', async () => {
      pool.query
        // UPDATE ... RETURNING overdue check-ins
        .mockResolvedValueOnce({ rows: [{ id: 'chk-1', contract_id: 'c-1', partner_id: 'p-1' }] })
        // owner lookup
        .mockResolvedValueOnce({ rows: [{ user_id: 'u-1' }] });
      partners.escalateMissedCheckIn.mockResolvedValueOnce({
        level: 'STAKE_WARNING',
        message: 'Stake warning issued: partner p-1 missed 2 consecutive check-ins on contract c-1',
      });

      await scheduler.escalateOverdueCheckIns();

      expect(partners.escalateMissedCheckIn).toHaveBeenCalledWith('chk-1');
      expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'u-1',
        type: 'PARTNER_CHECKIN_ESCALATION',
        title: 'Stake Warning: Missed Check-Ins',
        body: expect.stringContaining('Stake warning issued'),
        metadata: expect.objectContaining({ checkInId: 'chk-1', level: 'STAKE_WARNING' }),
      }));
      expect(pool.query.mock.calls[0][0]).toContain("SET status = 'MISSED'");
    });

    it('continues escalating after one check-in fails', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [
            { id: 'chk-1', contract_id: 'c-1', partner_id: 'p-1' },
            { id: 'chk-2', contract_id: 'c-2', partner_id: 'p-2' },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ user_id: 'u-2' }] });
      partners.escalateMissedCheckIn
        .mockRejectedValueOnce(new Error('db hiccup'))
        .mockResolvedValueOnce({ level: 'NOTIFY', message: 'Soft reminder sent' });

      await scheduler.escalateOverdueCheckIns();

      expect(partners.escalateMissedCheckIn).toHaveBeenCalledTimes(2);
      expect(notifications.create).toHaveBeenCalledTimes(1);
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u-2', title: 'Missed Partner Check-In' }),
      );
    });

    it('still escalates without a notification service, but sends nothing', async () => {
      const bare = build(false);
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'chk-1', contract_id: 'c-1', partner_id: 'p-1' }],
      });
      partners.escalateMissedCheckIn.mockResolvedValueOnce({
        level: 'CRISIS_TEAM',
        message: 'Safety team alerted',
      });

      await bare.escalateOverdueCheckIns();

      expect(partners.escalateMissedCheckIn).toHaveBeenCalledWith('chk-1');
      // Only the UPDATE ran — no owner lookup, no notification.
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });
});
