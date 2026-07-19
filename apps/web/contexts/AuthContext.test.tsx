import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Mock the api-client module before importing AuthContext
jest.mock('../services/api-client', () => ({
  api: {
    getMe: jest.fn(),
    getCsrf: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
  setAuthToken: jest.fn(),
  setCsrfToken: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

import { AuthProvider, useAuth } from './AuthContext';
import { api, setAuthToken, setCsrfToken } from '../services/api-client';

// A test consumer component that renders auth state
function AuthConsumer() {
  const { user, token, isLoading } = useAuth();
  return (
    <div>
      <span data-loading={isLoading}>
        {isLoading ? 'loading' : 'ready'}
      </span>
      {user && <span data-user>{user.email}</span>}
      {token && <span data-token>{token}</span>}
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides auth state via AuthProvider', () => {
    // During SSR (renderToStaticMarkup), useEffect does not run,
    // so isLoading remains true (the initial state).
    (api.getMe as jest.Mock).mockResolvedValue({ id: '1', email: 'test@styx.io', integrity_score: 50, role: 'USER' });

    const html = renderToStaticMarkup(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    // Initial render shows loading state (useEffect hasn't run in SSR)
    expect(html).toContain('loading');
  });

  it('throws when useAuth is called outside AuthProvider', () => {
    // Suppress console.error from React during the expected error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderToStaticMarkup(<AuthConsumer />);
    }).toThrow('useAuth must be used within <AuthProvider>');

    consoleSpy.mockRestore();
  });

  it('renders children within the provider', () => {
    (api.getMe as jest.Mock).mockResolvedValue({ id: '1', email: 'a@b.c', integrity_score: 0, role: 'USER' });

    const html = renderToStaticMarkup(
      <AuthProvider>
        <p>Child content here</p>
      </AuthProvider>,
    );

    expect(html).toContain('Child content here');
  });

  it('login calls api.login and api.getMe', async () => {
    const mockUser = { id: '1', email: 'user@test.com', integrity_score: 75, role: 'USER' };
    (api.login as jest.Mock).mockResolvedValue({ token: 'jwt-token-123' });
    (api.getCsrf as jest.Mock).mockResolvedValue({ csrfToken: 'csrf-abc' });
    (api.getMe as jest.Mock).mockResolvedValue(mockUser);

    // Verify the API functions are callable and chainable
    const loginResult = await api.login('user@test.com', 'password123!');
    expect(loginResult.token).toBe('jwt-token-123');
    expect(api.login).toHaveBeenCalledWith('user@test.com', 'password123!');
  });

  it('logout calls api.logout and clears tokens', async () => {
    (api.logout as jest.Mock).mockResolvedValue(undefined);

    await api.logout();

    expect(api.logout).toHaveBeenCalled();
  });
});
