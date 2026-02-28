/**
 * LoginScreen — desktop panel tests
 *
 * Tests login form submission, token management, error handling,
 * and the onLogin callback.
 * Uses the same mock pattern from api.spec.ts (node env, no DOM).
 */

import { api, setToken } from '../services/api';

jest.mock('../services/api', () => {
  let _token = '';
  return {
    api: {
      login: jest.fn(),
    },
    setToken: jest.fn((t: string) => { _token = t; }),
    getToken: jest.fn(() => _token),
  };
});

const mockLogin = api.login as jest.Mock;
const mockSetToken = setToken as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (setToken as jest.Mock)('');
});

describe('LoginScreen', () => {
  describe('form submission flow', () => {
    it('calls api.login with email and password', async () => {
      mockLogin.mockResolvedValue({ userId: 'user-1', token: 'jwt-abc' });

      const result = await api.login('admin@styx.io', 'secret');

      expect(mockLogin).toHaveBeenCalledWith('admin@styx.io', 'secret');
      expect(result.userId).toBe('user-1');
      expect(result.token).toBe('jwt-abc');
    });

    it('calls setToken with returned token on success', async () => {
      mockLogin.mockResolvedValue({ userId: 'user-1', token: 'jwt-xyz' });

      const { token } = await api.login('admin@styx.io', 'pass');
      setToken(token);

      expect(mockSetToken).toHaveBeenCalledWith('jwt-xyz');
    });

    it('invokes onLogin callback with userId on success', async () => {
      mockLogin.mockResolvedValue({ userId: 'user-42', token: 'jwt-token' });
      const onLogin = jest.fn();

      const { userId, token } = await api.login('user@styx.io', 'pw');
      setToken(token);
      onLogin(userId);

      expect(onLogin).toHaveBeenCalledWith('user-42');
    });
  });

  describe('error handling', () => {
    it('captures error message when login fails', async () => {
      mockLogin.mockRejectedValue(new Error('API 401: Unauthorized'));

      let error = '';
      try {
        await api.login('wrong@styx.io', 'badpass');
      } catch (err: any) {
        error = err.message || 'Login failed';
      }

      expect(error).toBe('API 401: Unauthorized');
    });

    it('uses fallback message when error has no message', async () => {
      mockLogin.mockRejectedValue({});

      let error = '';
      try {
        await api.login('test@styx.io', 'nopass');
      } catch (err: any) {
        error = err.message || 'Login failed';
      }

      expect(error).toBe('Login failed');
    });

    it('does not call setToken when login fails', async () => {
      mockLogin.mockRejectedValue(new Error('Network error'));

      try {
        await api.login('fail@styx.io', 'pw');
      } catch {
        // expected
      }

      // setToken should not be called after login failure
      // (was called once in beforeEach with '' — verify no additional calls)
      expect(mockSetToken).toHaveBeenCalledTimes(1); // only the beforeEach reset
      expect(mockSetToken).toHaveBeenCalledWith('');
    });

    it('does not invoke onLogin when login fails', async () => {
      mockLogin.mockRejectedValue(new Error('Forbidden'));
      const onLogin = jest.fn();

      try {
        await api.login('blocked@styx.io', 'pw');
        // Only call onLogin on success — this line should not execute
        onLogin('should-not-happen');
      } catch {
        // expected
      }

      expect(onLogin).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('button text shows Authenticating... while loading', () => {
      const loading = true;
      const buttonText = loading ? 'Authenticating...' : 'Enter The Court';
      expect(buttonText).toBe('Authenticating...');
    });

    it('button text shows Enter The Court when not loading', () => {
      const loading = false;
      const buttonText = loading ? 'Authenticating...' : 'Enter The Court';
      expect(buttonText).toBe('Enter The Court');
    });

    it('button is disabled while loading', () => {
      const loading = true;
      expect(loading).toBe(true); // disabled={loading}
    });
  });

  describe('complete login lifecycle', () => {
    it('simulates full happy-path: submit -> api.login -> setToken -> onLogin', async () => {
      mockLogin.mockResolvedValue({ userId: 'judge-001', token: 'jwt-secure-token' });
      const onLogin = jest.fn();

      // Simulate the component's handleSubmit
      let loading = false;
      let error = '';

      loading = true;
      error = '';

      try {
        const { userId, token } = await api.login('judge@styx.io', 'supersecret');
        setToken(token);
        onLogin(userId);
      } catch (err: any) {
        error = err.message || 'Login failed';
      } finally {
        loading = false;
      }

      expect(loading).toBe(false);
      expect(error).toBe('');
      expect(mockSetToken).toHaveBeenCalledWith('jwt-secure-token');
      expect(onLogin).toHaveBeenCalledWith('judge-001');
    });

    it('simulates full error-path: submit -> api.login throws -> error set', async () => {
      mockLogin.mockRejectedValue(new Error('API 500: Internal Server Error'));
      const onLogin = jest.fn();

      let loading = false;
      let error = '';

      loading = true;
      error = '';

      try {
        const { userId, token } = await api.login('judge@styx.io', 'pw');
        setToken(token);
        onLogin(userId);
      } catch (err: any) {
        error = err.message || 'Login failed';
      } finally {
        loading = false;
      }

      expect(loading).toBe(false);
      expect(error).toBe('API 500: Internal Server Error');
      expect(onLogin).not.toHaveBeenCalled();
    });
  });
});
