import { NotificationsController, FeedController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

jest.mock('../../../guards/sse-ticket.store', () => ({
  issueSseTicket: jest.fn().mockReturnValue({
    ticket: 'test-ticket-abc',
    expiresInSeconds: 60,
  }),
}));

import { issueSseTicket } from '../../../guards/sse-ticket.store';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let mockService: jest.Mocked<Pick<
    NotificationsService,
    'getUserNotifications' | 'getUnreadCount' | 'markRead' | 'getStreamForUser'
  >>;

  const user = { id: 'user-001' };

  beforeEach(() => {
    mockService = {
      getUserNotifications: jest.fn(),
      getUnreadCount: jest.fn(),
      markRead: jest.fn(),
      getStreamForUser: jest.fn(),
    };
    controller = new NotificationsController(mockService as unknown as NotificationsService);
    jest.clearAllMocks();
    // Re-mock after clearAllMocks since jest.mock is hoisted
    (issueSseTicket as jest.Mock).mockReturnValue({
      ticket: 'test-ticket-abc',
      expiresInSeconds: 60,
    });
  });

  describe('getNotifications', () => {
    it('should return user notifications', async () => {
      const notifications = [
        { id: 'n-1', user_id: 'user-001', type: 'CONTRACT_CREATED', title: 'Oath Created', body: null, read: false, metadata: null, created_at: '2026-02-27T10:00:00Z' },
        { id: 'n-2', user_id: 'user-001', type: 'PROOF_SUBMITTED', title: 'Proof Submitted', body: null, read: true, metadata: null, created_at: '2026-02-27T09:00:00Z' },
      ];
      mockService.getUserNotifications.mockResolvedValue(notifications);

      const result = await controller.getNotifications(user);

      expect(result).toEqual(notifications);
      expect(mockService.getUserNotifications).toHaveBeenCalledWith('user-001');
    });

    it('should return empty array when no notifications', async () => {
      mockService.getUserNotifications.mockResolvedValue([]);

      const result = await controller.getNotifications(user);

      expect(result).toEqual([]);
    });
  });

  describe('getUnreadCount', () => {
    it('should return the unread count', async () => {
      mockService.getUnreadCount.mockResolvedValue(5);

      const result = await controller.getUnreadCount(user);

      expect(result).toEqual({ count: 5 });
      expect(mockService.getUnreadCount).toHaveBeenCalledWith('user-001');
    });

    it('should return zero when all read', async () => {
      mockService.getUnreadCount.mockResolvedValue(0);

      const result = await controller.getUnreadCount(user);

      expect(result).toEqual({ count: 0 });
    });
  });

  describe('issueStreamTicket', () => {
    it('should issue an SSE ticket for the user', () => {
      const result = controller.issueStreamTicket(user);

      expect(result).toEqual({
        ticket: 'test-ticket-abc',
        expiresInSeconds: 60,
      });
      expect(issueSseTicket).toHaveBeenCalledWith('user-001', 'notifications');
    });
  });

  describe('issueStreamCookie', () => {
    it('should set an HttpOnly cookie and return expiry', () => {
      const mockRes = {
        cookie: jest.fn(),
      } as any;

      const result = controller.issueStreamCookie(user, mockRes);

      expect(result).toEqual({ expiresInSeconds: 60 });
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'styx_notifications_sse_ticket',
        'test-ticket-abc',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/notifications/stream',
          maxAge: 60000,
        }),
      );
    });
  });

  describe('markRead', () => {
    it('should mark a notification as read', async () => {
      mockService.markRead.mockResolvedValue(undefined);

      const result = await controller.markRead('notif-123', user);

      expect(result).toEqual({ status: 'read' });
      expect(mockService.markRead).toHaveBeenCalledWith('notif-123', 'user-001');
    });
  });
});

describe('FeedController', () => {
  let controller: FeedController;
  let mockService: jest.Mocked<Pick<NotificationsService, 'getPublicFeed'>>;

  beforeEach(() => {
    mockService = {
      getPublicFeed: jest.fn(),
    };
    controller = new FeedController(mockService as unknown as NotificationsService);
    jest.clearAllMocks();
  });

  describe('getPublicFeed', () => {
    it('should return public feed events with default limit', async () => {
      const events = { events: [{ id: 'e-1', type: 'contract_created', message: 'Test', timestamp: '2026-02-27T10:00:00Z' }] };
      mockService.getPublicFeed.mockResolvedValue(events);

      const result = await controller.getPublicFeed();

      expect(result).toEqual(events);
      expect(mockService.getPublicFeed).toHaveBeenCalledWith(50);
    });

    it('should respect custom limit', async () => {
      mockService.getPublicFeed.mockResolvedValue({ events: [] });

      await controller.getPublicFeed('10');

      expect(mockService.getPublicFeed).toHaveBeenCalledWith(10);
    });

    it('should cap limit at 100', async () => {
      mockService.getPublicFeed.mockResolvedValue({ events: [] });

      await controller.getPublicFeed('500');

      expect(mockService.getPublicFeed).toHaveBeenCalledWith(100);
    });

    it('should default to 50 for invalid limit', async () => {
      mockService.getPublicFeed.mockResolvedValue({ events: [] });

      await controller.getPublicFeed('invalid');

      expect(mockService.getPublicFeed).toHaveBeenCalledWith(50);
    });
  });
});
