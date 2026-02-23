import { ApiClient } from './ApiClient';

export class NotificationService {
  /**
   * Abstracted Push Notification dispatcher.
   * Leverages APNs (Apple) and FCM (Firebase/Android) underlying bridges.
   */
  static async requestPermissions(): Promise<boolean> {
    console.log('Requesting strict OS notification permissions for Styx alerts...');
    // In production, this would call the native notification permission API
    return true;
  }

  static async scheduleGraceDayReminder(userId: string): Promise<void> {
    console.log(`Scheduling LOCAL notification: "GRACE DAY EXPIRING SOON. Submit proof to avoid burn." for user ${userId}`);
    // In production, sync with AsyncStorage or a local SQLite cache
    // and schedule via react-native-push-notification
  }

  static async registerDeviceToken(token: string): Promise<void> { // allow-secret
    console.log(`Transmitting device token to Styx API for remote push routing.`);
    // In production, POST the device token to the API for FCM/APNs routing
  }

  /**
   * Fetches unread notifications from the API.
   * Useful for badge counts and in-app notification display.
   */
  static async fetchNotifications() {
    try {
      const data = await ApiClient.getNotifications();
      return data.notifications;
    } catch (err) {
      console.error('NotificationService: Failed to fetch notifications', err);
      return [];
    }
  }

  /**
   * Returns the count of unread notifications for badge display.
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const notifications = await NotificationService.fetchNotifications();
      return notifications.filter((n: any) => !n.read).length;
    } catch {
      return 0;
    }
  }
}
