import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@styx_auth_token';
const USER_ID_KEY = '@styx_user_id';

export class SessionService {
  /**
   * Securely saves the JWT token for subsequent API calls.
   * Note: In a true prod bare workflow, consider `react-native-keychain` for
   * stronger hardware-backed encryption, but AsyncStorage works for Alpha.
   */
  static async saveSession(token: string, userId: string): Promise<void> { // allow-secret
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_ID_KEY, userId);
    } catch (e) {
      console.error('SessionService: Failed to save session', e);
      throw new Error('Failed to save authentication session.');
    }
  }

  /**
   * Retrieves the current JWT token.
   */
  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error('SessionService: Failed to get token', e);
      return null;
    }
  }

  /**
   * Retrieves the current logged in User ID.
   */
  static async getUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(USER_ID_KEY);
    } catch (e) {
      console.error('SessionService: Failed to get user ID', e);
      return null;
    }
  }

  /**
   * Clears the current session (Logout).
   */
  static async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_ID_KEY);
    } catch (e) {
      console.error('SessionService: Failed to clear session', e);
    }
  }
}
