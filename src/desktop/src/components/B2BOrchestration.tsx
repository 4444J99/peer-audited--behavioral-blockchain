import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Copy, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface ApiKey {
  id: string;
  key: string;
  enterprise: string;
  createdAt: string;
  active: boolean;
}

export default function B2BOrchestration() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [enterpriseId, setEnterpriseId] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [newKeyDisplay, setNewKeyDisplay] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setError('');
      const result = await api.getEnterpriseKeys();
      setKeys(result.keys || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleGenerate = async () => {
    if (!enterpriseId.trim()) return;
    setGenerating(true);
    setActionFeedback(null);
    setNewKeyDisplay(null);

    try {
      const result = await api.generateApiKey(enterpriseId.trim());
      setNewKeyDisplay(result.key);
      setActionFeedback({ type: 'success', message: `API key generated for ${enterpriseId}.` });
      setEnterpriseId('');
      setShowGenerateForm(false);
      // Refresh key list
      await fetchKeys();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to generate key' });
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    setRevokingId(keyId);
    setActionFeedback(null);

    try {
      await api.revokeApiKey(keyId);
      setActionFeedback({ type: 'success', message: `Key ${keyId} revoked successfully.` });
      // Update key in local state
      setKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, active: false } : k))
      );
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || `Failed to revoke key ${keyId}` });
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).catch(() => {
      // Clipboard write failed — no action needed
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
        {React.createElement(Building2 as any, { size: 18 })} Enterprise Orchestration
      </h2>

      {/* Action Feedback */}
      {actionFeedback && (
        <div style={{
          backgroundColor: actionFeedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.1)',
          border: `1px solid ${actionFeedback.type === 'success' ? '#22c55e' : '#DC2626'}`,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          color: actionFeedback.type === 'success' ? '#22c55e' : '#ff6666',
          fontSize: '0.9rem',
        }}>
          {actionFeedback.message}
        </div>
      )}

      {/* Newly Generated Key Display */}
      {newKeyDisplay && (
        <div style={{
          backgroundColor: 'rgba(34,197,94,0.1)',
          border: '1px solid #22c55e',
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '4px',
        }}>
          <div style={{ fontSize: '0.8rem', color: '#22c55e', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            New API Key (copy now — will not be shown again)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <code style={{ fontFamily: 'monospace', color: '#fff', fontSize: '0.9rem', flex: 1, wordBreak: 'break-all' }}>
              {newKeyDisplay}
            </code>
            <button
              onClick={() => handleCopyKey(newKeyDisplay)}
              style={{ background: '#22c55e', border: 'none', color: '#000', padding: '0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
            >
              COPY
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(220,38,38,0.1)',
          border: '1px solid #DC2626',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          color: '#ff6666',
          fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: '#888', margin: 0 }}>API Key management for Phase Omega B2B external integrations.</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => {
              setLoading(true);
              fetchKeys();
            }}
            style={{
              backgroundColor: '#222',
              color: '#fff',
              border: '1px solid #333',
              padding: '0.5rem 1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
            }}
          >
            {React.createElement(RefreshCw as any, { size: 14 })} REFRESH
          </button>
          <button
            onClick={() => setShowGenerateForm(!showGenerateForm)}
            style={{
              backgroundColor: '#fff',
              color: '#000',
              border: 'none',
              padding: '0.5rem 1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {React.createElement(Plus as any, { size: 14 })} GENERATE NEW KEY
          </button>
        </div>
      </div>

      {/* Generate Key Form */}
      {showGenerateForm && (
        <div style={{
          backgroundColor: '#111',
          border: '1px solid #333',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end',
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              Enterprise ID
            </label>
            <input
              value={enterpriseId}
              onChange={(e) => setEnterpriseId(e.target.value)}
              placeholder="e.g. acme-corp-001"
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#000',
                border: '1px solid #333',
                color: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !enterpriseId.trim()}
            style={{
              backgroundColor: generating || !enterpriseId.trim() ? '#333' : '#22c55e',
              color: generating || !enterpriseId.trim() ? '#666' : '#000',
              border: 'none',
              padding: '0.5rem 1.5rem',
              fontWeight: 'bold',
              cursor: generating || !enterpriseId.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {generating ? 'GENERATING...' : 'CREATE'}
          </button>
          <button
            onClick={() => { setShowGenerateForm(false); setEnterpriseId(''); }}
            style={{
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #333',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            CANCEL
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          Loading API keys...
        </div>
      ) : keys.length === 0 ? (
        <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '2rem', textAlign: 'center', color: '#666' }}>
          No API keys found. Generate one to get started.
        </div>
      ) : (
        <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ paddingBottom: '1rem' }}>Client ID / Key Prefix</th>
                <th style={{ paddingBottom: '1rem' }}>Enterprise Entity</th>
                <th style={{ paddingBottom: '1rem' }}>Created</th>
                <th style={{ paddingBottom: '1rem' }}>Status</th>
                <th style={{ paddingBottom: '1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {k.id}
                    <span
                      onClick={() => handleCopyKey(k.key || k.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {React.createElement(Copy as any, { size: 12 })}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0', color: '#fff', fontWeight: 'bold' }}>{k.enterprise}</td>
                  <td style={{ padding: '1rem 0', color: '#666', fontSize: '0.9rem' }}>{k.createdAt}</td>
                  <td style={{ padding: '1rem 0', fontSize: '0.8rem' }}>
                    <span style={{
                      backgroundColor: k.active ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.1)',
                      color: k.active ? '#22c55e' : '#DC2626',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                    }}>
                      {k.active ? 'ACTIVE' : 'REVOKED'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0' }}>
                    {k.active && (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        disabled={revokingId === k.id}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: revokingId === k.id ? '#555' : '#333',
                          color: revokingId === k.id ? '#888' : '#fff',
                          border: 'none',
                          cursor: revokingId === k.id ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        {revokingId === k.id ? 'REVOKING...' : 'REVOKE'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
