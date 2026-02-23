import React, { useState } from 'react';
import { api, setToken } from '../services/api';

interface LoginScreenProps {
  onLogin: (userId: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { userId, token } = await api.login(email, password);
      setToken(token);
      onLogin(userId);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#0a0a0f',
      color: '#e0e0e0',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#1a1a2e',
        padding: '2rem',
        borderRadius: '12px',
        width: '360px',
        border: '1px solid #2a2a3e',
      }}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#ff4444' }}>
          STYX ADMIN
        </h1>
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#888' }}>
          The Judge — Administrative Console
        </p>

        {error && (
          <div style={{
            background: '#ff444420',
            border: '1px solid #ff4444',
            borderRadius: '6px',
            padding: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: '#ff6666',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#aaa' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#0a0a1a',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#e0e0e0',
              fontSize: '0.875rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#aaa' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#0a0a1a',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#e0e0e0',
              fontSize: '0.875rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.625rem',
            background: loading ? '#333' : '#ff4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Authenticating...' : 'Enter The Court'}
        </button>
      </form>
    </div>
  );
}
