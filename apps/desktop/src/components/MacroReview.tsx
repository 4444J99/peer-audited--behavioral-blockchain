import React, { useState, useEffect, useCallback } from 'react';
import { Activity, ShieldAlert, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface QueueItem {
  id: string;
  severity: string;
  type: string;
  user: string;
  peers: string[];
  status: string;
}

interface DashboardStats {
  totalUsers: number;
  activeContracts: number;
  pendingProofs: number;
  avgIntegrity: number;
}

export default function MacroReview() {
  const [globalQueue, setGlobalQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const statsResult = await api.getAdminStats();
      setStats(statsResult);

      // Build queue items from the stats data
      // In a full implementation, there would be a dedicated queue endpoint.
      // For now, derive pending items from stats + truth log.
      const items: QueueItem[] = [];

      if (statsResult.pendingProofs > 0) {
        items.push({
          id: `fury_q_pending`,
          severity: statsResult.pendingProofs > 10 ? 'HIGH' : 'MEDIUM',
          type: 'PENDING_PROOFS',
          user: 'SYSTEM',
          peers: [],
          status: `${statsResult.pendingProofs} PROOFS AWAITING REVIEW`,
        });
      }

      // Also fetch recent truth log for escalated items
      try {
        const logResult = await api.getTruthLog(20);
        const transactions = logResult.transactions || [];
        transactions.forEach((tx: any, idx: number) => {
          if (tx.type === 'APPEAL' || tx.type === 'CONFLICT' || tx.type === 'HONEYPOT_FAIL' ||
              tx.status === 'ESCALATED' || tx.status === 'PENALTY_PENDING') {
            items.push({
              id: tx.id || tx.tx_hash || `fury_q_${idx}`,
              severity: tx.type === 'HONEYPOT_FAIL' ? 'CRITICAL' : tx.type === 'CONFLICT' ? 'HIGH' : 'LOW',
              type: tx.type || tx.event_type || 'UNKNOWN',
              user: tx.user || tx.user_id || 'UNKNOWN',
              peers: tx.peers || [],
              status: tx.status || 'PENDING',
            });
          }
        });
      } catch {
        // Truth log fetch failed — queue still shows stats-based items
      }

      setGlobalQueue(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
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

  const criticalCount = globalQueue.filter((item) => item.severity === 'CRITICAL').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {React.createElement(Activity as any, { size: 18 })} Global Queue Health
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
          {React.createElement(RefreshCw as any, { size: 14 })}
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

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#111', border: '1px solid #222' }}>
            <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Users</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalUsers.toLocaleString()}</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#111', border: '1px solid #222' }}>
            <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Contracts</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.activeContracts.toLocaleString()}</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#111', border: '1px solid #222', borderLeft: '3px solid #eab308' }}>
            <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pending Proofs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats.pendingProofs > 0 ? '#eab308' : '#22c55e' }}>{stats.pendingProofs}</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#111', border: '1px solid #222' }}>
            <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Avg Integrity</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats.avgIntegrity >= 50 ? '#22c55e' : '#DC2626' }}>{stats.avgIntegrity.toFixed(1)}</div>
          </div>
        </div>
      )}

      {/* Critical Alerts Panel */}
      {criticalCount > 0 && (
        <div style={{ backgroundColor: 'rgba(220,38,38,0.1)', border: '1px solid #DC2626', padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          {React.createElement(ShieldAlert as any, { size: 24, color: '#DC2626' })}
          <div>
            <h3 style={{ color: '#DC2626', margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>{criticalCount} Critical Intervention{criticalCount > 1 ? 's' : ''} Required</h3>
            <p style={{ color: '#ff9999', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              {criticalCount} item{criticalCount > 1 ? 's' : ''} in the queue require{criticalCount === 1 ? 's' : ''} immediate Judge approval.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          Loading queue data...
        </div>
      ) : globalQueue.length === 0 ? (
        <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '2rem', textAlign: 'center', color: '#666' }}>
          Queue is clear. No pending interventions.
        </div>
      ) : (
        <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ paddingBottom: '1rem' }}>Queue ID</th>
                <th style={{ paddingBottom: '1rem' }}>Severity</th>
                <th style={{ paddingBottom: '1rem' }}>Event Type</th>
                <th style={{ paddingBottom: '1rem' }}>Target Subject</th>
                <th style={{ paddingBottom: '1rem' }}>Routing Status</th>
                <th style={{ paddingBottom: '1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {globalQueue.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: '#888' }}>{item.id}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <span style={{
                      backgroundColor: item.severity === 'CRITICAL' ? 'rgba(220,38,38,0.2)' : item.severity === 'HIGH' ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.1)',
                      color: item.severity === 'CRITICAL' ? '#DC2626' : item.severity === 'HIGH' ? '#eab308' : '#22c55e',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                    }}>
                      {item.severity}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0', fontWeight: 'bold', color: item.type === 'HONEYPOT_FAIL' ? '#DC2626' : '#fff' }}>{item.type}</td>
                  <td style={{ padding: '1rem 0', fontFamily: 'monospace' }}>{item.user}</td>
                  <td style={{ padding: '1rem 0', fontSize: '0.9rem', color: '#aaa' }}>{item.status}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <button style={{ padding: '0.5rem 1rem', backgroundColor: '#DC2626', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                      OVERRIDE
                    </button>
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
