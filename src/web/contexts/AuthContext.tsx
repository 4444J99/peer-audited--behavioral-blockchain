'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAuthToken, getAuthToken } from '../services/api-client';

interface User {
  id: string;
  email: string;
  integrity_score: number;
  role: string;
  created_at?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null; // allow-secret
  login: (email: string, password: string) => Promise<void>; // allow-secret
  register: (email: string, password: string) => Promise<void>; // allow-secret
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'styx_auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore token from localStorage and fetch user
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setAuthToken(stored);
      setToken(stored);
      api.getMe()
        .then((me) => setUser(me))
        .catch(() => {
          // Token expired or invalid — clear it
          localStorage.removeItem(TOKEN_KEY);
          setAuthToken('');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => { // allow-secret
    const result = await api.login(email, password);
    localStorage.setItem(TOKEN_KEY, result.token);
    setAuthToken(result.token);
    setToken(result.token);
    const me = await api.getMe();
    setUser(me);
  }, []);

  const register = useCallback(async (email: string, password: string) => { // allow-secret
    const result = await api.register(email, password);
    localStorage.setItem(TOKEN_KEY, result.token);
    setAuthToken(result.token);
    setToken(result.token);
    const me = await api.getMe();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken('');
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
