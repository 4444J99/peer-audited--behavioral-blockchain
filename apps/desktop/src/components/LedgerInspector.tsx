import React, { useState, useEffect, useCallback } from 'react';
import { Database, Search, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface TruthEvent {
  tx_hash: string;
  timestamp: string;
  type: string;
  user: string;
  amount: string;
  status: string;
}

interface AdminStats {
  totalUsers: number;
  activeContracts: number;
  pendingProofs: number;
  avgIntegrity: number;
}

export default function LedgerInspector() {
  const [truthEvents, setTruthEvents] = useState<TruthEvent[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [logResult, statsResult] = await Promise.allSettled([
        api.getTruthLog(100),
        api.getAdminStats(),
      ]);

      if (logResult.status === 'fulfilled') {
        // Normalize the API response into our TruthEvent shape
        const transactions = logResult.value.transactions || [];
        const events: TruthEvent[] = transactions.map((tx: any) => ({
          tx_hash: tx.tx_hash || tx.hash || tx.id || '---',
          timestamp: tx.timestamp || tx.created_at || tx.createdAt || '---',
          type: tx.type || tx.event_type || tx.eventType || 'UNKNOWN',
          user: tx.user || tx.user_id || tx.userId || '---',
          amount: tx.amount != null ? `$${Number(tx.amount).toFixed(2)}` : '---',
          status: tx.status || 'UNKNOWN',
        }));
        setTruthEvents(events);
      } else {
        setError(`Failed to load truth log: ${logResult.reason}`);
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filter events by search query
  const filteredEvents = truthEvents.filter((evt) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      evt.tx_hash.toLowerCase().includes(q) ||
      evt.user.toLowerCase().includes(q) ||
      evt.type.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {React.createElement(Database as any, { size: 18 })} Ledger Inspection Tool
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: '#222',
            border: '1px solid #333',
            color: refreshing ? '#666' : '#fff',
            padding: '0.5rem 1rem',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {React.createElement(RefreshCw as any, { size: 14, style: refreshing ? { animation: 'spin 1s linear infinite' } : {} })}
          {refreshing ? 'REFRESHING...' : 'REFRESH'}
        </button>
      </div>

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

      <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '1.5rem', marginBottom: '2rem' }}>
        <p style={{ color: '#888', marginBottom: '1rem' }}>Raw PostgreSQL Truth Log stream. Verifying systemic financial constraints.</p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#000', border: '1px solid #333', padding: '0.5rem 1rem', flex: 1 }}>
            {React.createElement(Search as any, { size: 14, color: '#666' })}
            <input
              type="text"
              placeholder="Search by TX Hash, User ID, or Event Type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', marginLeft: '0.5rem', width: '100%', outline: 'none' }}
            />
          </div>
          <button
            onClick={() => setSearchQuery('')}
            style={{ backgroundColor: '#333', color: '#fff', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            CLEAR
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading truth log...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            {searchQuery ? 'No events match your search.' : 'No events found.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ paddingBottom: '1rem' }}>TX Hash</th>
                <th style={{ paddingBottom: '1rem' }}>Timestamp</th>
                <th style={{ paddingBottom: '1rem' }}>Event Type</th>
                <th style={{ paddingBottom: '1rem' }}>Target</th>
                <th style={{ paddingBottom: '1rem' }}>Amount</th>
                <th style={{ paddingBottom: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((evt, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '0.75rem 0', fontFamily: 'monospace', color: '#888', fontSize: '0.9rem' }}>{evt.tx_hash}</td>
                  <td style={{ padding: '0.75rem 0', color: '#666', fontSize: '0.9rem' }}>{evt.timestamp}</td>
                  <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: evt.type.includes('BURNED') || evt.type.includes('FRAUD') ? '#DC2626' : '#fff', fontSize: '0.9rem' }}>{evt.type}</td>
                  <td style={{ padding: '0.75rem 0', fontFamily: 'monospace', fontSize: '0.9rem' }}>{evt.user}</td>
                  <td style={{ padding: '0.75rem 0', fontFamily: 'monospace', fontSize: '0.9rem' }}>{evt.amount}</td>
                  <td style={{ padding: '0.75rem 0', fontSize: '0.8rem' }}>
                    <span style={{
                      backgroundColor: evt.status === 'CONFIRMED' ? 'rgba(34,197,94,0.1)' : evt.status === 'FAILED' ? 'rgba(220,38,38,0.1)' : 'rgba(234,179,8,0.1)',
                      color: evt.status === 'CONFIRMED' ? '#22c55e' : evt.status === 'FAILED' ? '#DC2626' : '#eab308',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                    }}>
                      {evt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* System Integrity Snapshot */}
      <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#bbb' }}>System Integrity Snapshot</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#111', border: '1px solid #222' }}>
          <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Users</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {stats ? stats.totalUsers.toLocaleString() : '---'}
          </div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#111', border: '1px solid #222', borderLeft: '3px solid #eab308' }}>
          <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Contracts</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {stats ? stats.activeContracts.toLocaleString() : '---'}
          </div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#111', border: '1px solid #222', borderLeft: '3px solid #DC2626' }}>
          <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Avg Integrity Score</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {stats ? stats.avgIntegrity.toFixed(1) : '---'} {React.createElement(ArrowRightLeft as any, { size: 16, color: stats && stats.avgIntegrity >= 50 ? '#22c55e' : '#DC2626' })}
          </div>
        </div>
      </div>
    </div>
  );
}
