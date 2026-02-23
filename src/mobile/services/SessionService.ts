import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from './ApiClient';

const TOKEN_KEY = '@styx_auth_token';
const USER_ID_KEY = '@styx_user_id';

export class SessionService {
  /**
   * Saves the JWT token and userId, and sets the auth token on ApiClient
   * for subsequent API calls.
   * Note: In a true prod bare workflow, consider `react-native-keychain` for
   * stronger hardware-backed encryption, but AsyncStorage works for Alpha.
   */
  static async saveSession(userId: string, token: string): Promise<void> { // allow-secret
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      setAuthToken(token);
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
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
      }
      return token;
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
   * Clears the current session (Logout) and removes the auth token from ApiClient.
   */
  static async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_ID_KEY);
      setAuthToken(null);
    } catch (e) {
      console.error('SessionService: Failed to clear session', e);
    }
  }

  /**
   * Checks whether a session exists by looking for a stored token.
   */
  static async isLoggedIn(): Promise<boolean> {
    const token = await SessionService.getToken();
    return token !== null;
  }
}
