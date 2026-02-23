import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionService } from './SessionService';
import { getAuthToken, setAuthToken } from './ApiClient';

beforeEach(async () => {
  // Reset in-memory store and mocks between tests
  (AsyncStorage as any)._store.clear();
  jest.clearAllMocks();
  setAuthToken(null);
});

describe('SessionService', () => {
  describe('saveSession()', () => {
    it('stores token and userId in AsyncStorage and sets auth token', async () => {
      await SessionService.saveSession('user-1', 'jwt-abc');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@styx_auth_token', 'jwt-abc');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@styx_user_id', 'user-1');
      expect(getAuthToken()).toBe('jwt-abc');
    });

    it('re-throws when AsyncStorage fails', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));

      await expect(SessionService.saveSession('u', 't')).rejects.toThrow(
        'Failed to save authentication session.',
      );
    });
  });

  describe('getToken()', () => {
    it('returns stored token and calls setAuthToken', async () => {
      await SessionService.saveSession('u1', 'tok-99');
      setAuthToken(null); // clear so we verify getToken re-sets it

      const token = await SessionService.getToken();

      expect(token).toBe('tok-99');
      expect(getAuthToken()).toBe('tok-99');
    });

    it('returns null when no token is stored', async () => {
      const token = await SessionService.getToken();
      expect(token).toBeNull();
    });
  });

  describe('getUserId()', () => {
    it('returns stored userId', async () => {
      await SessionService.saveSession('user-42', 'tok');

      const userId = await SessionService.getUserId();
      expect(userId).toBe('user-42');
    });
  });

  describe('clearSession()', () => {
    it('removes both keys and sets auth to null', async () => {
      await SessionService.saveSession('u1', 'tok');
      await SessionService.clearSession();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@styx_auth_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@styx_user_id');
      expect(getAuthToken()).toBeNull();
    });
  });

  describe('isLoggedIn()', () => {
    it('returns true when token exists', async () => {
      await SessionService.saveSession('u', 'tok');

      expect(await SessionService.isLoggedIn()).toBe(true);
    });

    it('returns false when no token', async () => {
      expect(await SessionService.isLoggedIn()).toBe(false);
    });
  });
});
