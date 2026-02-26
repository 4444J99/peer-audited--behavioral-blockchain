'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAuthToken, setCsrfToken } from '../services/api-client';

interface User {
  id: string;
  email: string;
  integrity_score: number;
  role: string;
  status?: string;
  created_at?: string;
  compliance?: {
    kyc_status: string;
    age_verification_status: string;
    is_kyc_verified: boolean;
    is_age_verified: boolean;
  };
}

interface AuthContextValue {
  user: User | null;
  token: string | null; // allow-secret
  login: (email: string, password: string) => Promise<void>; // allow-secret
  register: (email: string, password: string) => Promise<void>; // allow-secret
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // legacy fallback visibility only
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore browser session from cookie (HttpOnly) via /users/me.
  useEffect(() => {
    api.getMe()
      .then(async (me) => {
        setUser(me);
        try {
          const csrf = await api.getCsrf();
          setCsrfToken(csrf.csrfToken);
        } catch {
          // Non-fatal: mutating requests will refresh/retry if needed.
        }
      })
      .catch(() => {
        setAuthToken('');
        setCsrfToken('');
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => { // allow-secret
    const result = await api.login(email, password);
    // Keep bearer token in memory only as a compatibility fallback; cookie auth is primary.
    setAuthToken(result.token);
    setToken(result.token);
    try {
      const csrf = await api.getCsrf();
      setCsrfToken(csrf.csrfToken);
    } catch {
      // Login response also sets CSRF cookie; continue if refresh endpoint fails.
    }
    const me = await api.getMe();
    setUser(me);
  }, []);

  const register = useCallback(async (email: string, password: string) => { // allow-secret
    const result = await api.register(email, password);
    setAuthToken(result.token);
    setToken(result.token);
    try {
      const csrf = await api.getCsrf();
      setCsrfToken(csrf.csrfToken);
    } catch {
      // Registration response also sets CSRF cookie; continue if refresh endpoint fails.
    }
    const me = await api.getMe();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Clearing local state should not depend on server response.
    }
    setAuthToken('');
    setCsrfToken('');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
