import { Platform } from 'react-native';
import { ApiClient } from './ApiClient';

/**
 * Lazy-load expo-notifications so the service compiles even if the
 * package is not installed (e.g. in CI / test environments).
 */
let Notifications: typeof import('expo-notifications') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
} catch {
  // expo-notifications not installed — local scheduling will no-op
}

export class NotificationService {
  /**
   * Request notification permissions from the OS.
   * Returns true if granted, false otherwise.
   */
  static async requestPermissions(): Promise<boolean> {
    if (!Notifications) {
      console.warn('NotificationService: expo-notifications not available');
      return false;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Configure the default notification channel (Android) and behavior.
   * Call once at app startup.
   */
  static async initialize(): Promise<void> {
    if (!Notifications) return;

    // Android requires an explicit notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('styx-default', {
        name: 'Styx Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ff4444',
      });
    }

    // Show notifications even when the app is in the foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  /**
   * Schedule a local notification for a grace day expiring soon.
   */
  static async scheduleGraceDayReminder(userId: string): Promise<void> {
    if (!Notifications) {
      console.warn('NotificationService: expo-notifications not available — skipping grace day reminder');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Grace Day Expiring',
        body: 'Your grace day is about to expire. Submit proof to avoid a strike.',
        data: { type: 'grace_day_reminder', userId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60 * 60 * 2, // 2 hours from now
      },
    });
  }

  /**
   * Schedule a local notification reminding the user to complete today's attestation.
   */
  static async scheduleAttestationReminder(contractId: string): Promise<void> {
    if (!Notifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Check-In Due',
        body: 'You haven\'t completed today\'s attestation yet. Keep your streak alive.',
        data: { type: 'attestation_reminder', contractId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60 * 60 * 6, // 6 hours from now
      },
    });
  }

  /**
   * Schedule a local notification warning about an approaching contract deadline.
   */
  static async scheduleDeadlineWarning(contractId: string, hoursRemaining: number): Promise<void> {
    if (!Notifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Contract Deadline Approaching',
        body: `Your contract ends in ${hoursRemaining} hours. Submit final proof now.`,
        data: { type: 'deadline_warning', contractId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60, // fire in 1 minute as an alert
      },
    });
  }

  /**
   * Register the device's Expo push token with the API for remote push routing.
   */
  static async registerDeviceToken(token: string): Promise<void> { // allow-secret
    try {
      await ApiClient.registerPushToken(token);
    } catch (err) {
      console.error('NotificationService: Failed to register device token', err);
    }
  }

  /**
   * Get the Expo push token for this device.
   * Returns null if unavailable (e.g. simulator, permissions denied).
   */
  static async getExpoPushToken(): Promise<string | null> {
    if (!Notifications) return null;

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch {
      return null;
    }
  }

  /**
   * Cancel all pending local notifications.
   */
  static async cancelAll(): Promise<void> {
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Fetches unread notifications from the API.
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
