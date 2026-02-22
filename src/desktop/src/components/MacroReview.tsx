import React from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

export default function MacroReview() {
  const globalQueue = [
    { id: 'fury_q_901', severity: 'HIGH', type: 'CONFLICT', user: 'user_45x', peers: ['user_8a', 'user_9b', 'user_2c'], status: 'ESCALATED_2_1' },
    { id: 'fury_q_882', severity: 'CRITICAL', type: 'HONEYPOT_FAIL', user: 'SYSTEM', peers: ['user_7z'], status: 'PENALTY_PENDING' },
    { id: 'fury_q_881', severity: 'LOW', type: 'APPEAL', user: 'user_11p', peers: [], status: 'FEE_PAID_AWAITING_JUDGE' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {React.createElement(Activity as any, { size: 18 })} Global Queue Health
      </h2>

      {/* Critical Alerts Panel */}
      <div style={{ backgroundColor: 'rgba(220,38,38,0.1)', border: '1px solid #DC2626', padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
         {React.createElement(ShieldAlert as any, { size: 24, color: '#DC2626' })}
         <div>
            <h3 style={{ color: '#DC2626', margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>1 Critical Intervention Required</h3>
            <p style={{ color: '#ff9999', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>A systemic Honeypot test failed. A reviewer ("user_7z") passed a known bad proof. Immediate algorithmic penalty generation is pending Judge approval.</p>
         </div>
      </div>

      <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ paddingBottom: '1rem' }}>Queue ID</th>
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
    </div>
  );
}
