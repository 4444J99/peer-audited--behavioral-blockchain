import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new NotificationsService(mockPool as any);
  });

  describe('create', () => {
    it('should insert a notification and return the row', async () => {
      const created = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'CONTRACT_CREATED',
        title: 'Contract Created',
        body: 'Your contract is now active.',
        read: false,
        metadata: { contractId: 'c-1' },
        created_at: '2026-02-23T00:00:00Z',
      };
      mockPool.query.mockResolvedValueOnce({ rows: [created] });

      const result = await service.create({
        userId: 'user-1',
        type: 'CONTRACT_CREATED',
        title: 'Contract Created',
        body: 'Your contract is now active.',
        metadata: { contractId: 'c-1' },
      });

      expect(result).toEqual(created);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notifications'),
        ['user-1', 'CONTRACT_CREATED', 'Contract Created', 'Your contract is now active.', '{"contractId":"c-1"}'],
      );
    });

    it('should handle null body and metadata', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-2', user_id: 'user-1', type: 'TEST', title: 'Test', body: null, read: false, metadata: null, created_at: '2026-02-23T00:00:00Z' }],
      });

      await service.create({
        userId: 'user-1',
        type: 'TEST',
        title: 'Test',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notifications'),
        ['user-1', 'TEST', 'Test', null, null],
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should return notifications ordered by created_at desc', async () => {
      const notifs = [
        { id: 'n2', type: 'PROOF_SUBMITTED', title: 'Proof Submitted', read: false, created_at: '2026-02-23T01:00:00Z' },
        { id: 'n1', type: 'CONTRACT_CREATED', title: 'Contract Created', read: true, created_at: '2026-02-23T00:00:00Z' },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: notifs });

      const result = await service.getUserNotifications('user-1', 20);

      expect(result).toEqual(notifs);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        ['user-1', 20],
      );
    });
  });

  describe('markRead', () => {
    it('should update the notification read status', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await service.markRead('notif-1', 'user-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications SET read = TRUE'),
        ['notif-1', 'user-1'],
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return the count of unread notifications', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: '5' }] });

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
    });

    it('should return 0 when there are no unread notifications', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(0);
    });
  });
});
