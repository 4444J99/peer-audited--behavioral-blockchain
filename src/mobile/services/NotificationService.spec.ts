import { NotificationService } from './NotificationService';
import { ApiClient } from './ApiClient';

// Mock only ApiClient.getNotifications
jest.mock('./ApiClient', () => ({
  ApiClient: {
    getNotifications: jest.fn(),
  },
  setAuthToken: jest.fn(),
  getAuthToken: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const sampleNotifications = [
  { id: '1', type: 'CONTRACT', message: 'Contract created', read: false, createdAt: '2026-01-01' },
  { id: '2', type: 'FURY', message: 'New audit available', read: true, createdAt: '2026-01-02' },
  { id: '3', type: 'SYSTEM', message: 'Welcome to Styx', read: false, createdAt: '2026-01-03' },
];

describe('NotificationService', () => {
  describe('fetchNotifications()', () => {
    it('returns notifications from API', async () => {
      (ApiClient.getNotifications as jest.Mock).mockResolvedValueOnce({
        notifications: sampleNotifications,
      });

      const result = await NotificationService.fetchNotifications();

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('1');
    });

    it('returns empty array on error', async () => {
      (ApiClient.getNotifications as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await NotificationService.fetchNotifications();

      expect(result).toEqual([]);
    });
  });

  describe('getUnreadCount()', () => {
    it('counts unread notifications', async () => {
      (ApiClient.getNotifications as jest.Mock).mockResolvedValueOnce({
        notifications: sampleNotifications,
      });

      const count = await NotificationService.getUnreadCount();

      expect(count).toBe(2); // id 1 and 3 are unread
    });
  });

  describe('requestPermissions()', () => {
    it('returns true', async () => {
      const granted = await NotificationService.requestPermissions();
      expect(granted).toBe(true);
    });
  });
});
