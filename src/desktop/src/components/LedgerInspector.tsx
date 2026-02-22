import React from 'react';
import { Database, Search, ArrowRightLeft } from 'lucide-react';

export default function LedgerInspector() {
  // Mock Data: Simulated raw feed from the PostgreSQL Truth Log
  const truthEvents = [
    { tx_hash: '0xabc123...', timestamp: '2026-02-22T08:14:02Z', type: 'STAKE_HELD', user: 'usr_9x2', amount: '$50.00', status: 'CONFIRMED' },
    { tx_hash: '0xdef456...', timestamp: '2026-02-22T08:15:22Z', type: 'PROOF_SUBMITTED', user: 'usr_9x2', amount: '---', status: 'PENDING_REVIEW' },
    { tx_hash: '0xghi789...', timestamp: '2026-02-22T09:01:45Z', type: 'APPEAL_FEE_AUTHORIZED', user: 'usr_1a4', amount: '$5.00', status: 'CONFIRMED' },
    { tx_hash: '0xjkl012...', timestamp: '2026-02-22T10:11:10Z', type: 'STAKE_BURNED', user: 'usr_7b8', amount: '$100.00', status: 'CONFIRMED' },
    { tx_hash: '0xmno345...', timestamp: '2026-02-22T10:12:00Z', type: 'BOUNTY_DISTRIBUTED', user: 'SYSTEM', amount: '$100.00', status: 'DISTRIBUTING' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {React.createElement(Database as any, { size: 18 })} Ledger Inspection Tool
      </h2>

      <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '1.5rem', marginBottom: '2rem' }}>
        <p style={{ color: '#888', marginBottom: '1rem' }}>Raw PostgreSQL Truth Log stream. Verifying systemic financial constraints.</p>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#000', border: '1px solid #333', padding: '0.5rem 1rem', flex: 1 }}>
            {React.createElement(Search as any, { size: 14, color: '#666' })}
            <input type="text" placeholder="Search by TX Hash or User ID..." style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', marginLeft: '0.5rem', width: '100%', outline: 'none' }} />
          </div>
          <button style={{ backgroundColor: '#333', color: '#fff', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}>FILTER</button>
        </div>

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
            {truthEvents.map((evt, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '0.75rem 0', fontFamily: 'monospace', color: '#888', fontSize: '0.9rem' }}>{evt.tx_hash}</td>
                <td style={{ padding: '0.75rem 0', color: '#666', fontSize: '0.9rem' }}>{evt.timestamp}</td>
                <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: evt.type.includes('BURNED') ? '#DC2626' : '#fff', fontSize: '0.9rem' }}>{evt.type}</td>
                <td style={{ padding: '0.75rem 0', fontFamily: 'monospace', fontSize: '0.9rem' }}>{evt.user}</td>
                <td style={{ padding: '0.75rem 0', fontFamily: 'monospace', fontSize: '0.9rem' }}>{evt.amount}</td>
                <td style={{ padding: '0.75rem 0', fontSize: '0.8rem' }}>
                  <span style={{ backgroundColor: evt.status === 'CONFIRMED' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)', color: evt.status === 'CONFIRMED' ? '#22c55e' : '#eab308', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    {evt.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* System Integrity Snapshot */}
      <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#bbb' }}>System Integrity Snapshot</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#111', border: '1px solid #222' }}>
          <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total FBO Escrow</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$1,245,600.00</div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#111', border: '1px solid #222', borderLeft: '3px solid #eab308' }}>
          <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Bounties Pending Distribution</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$4,250.00</div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#111', border: '1px solid #222', borderLeft: '3px solid #DC2626' }}>
          <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Phantom Balance Delta (MUST BE $0)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            $0.00 {React.createElement(ArrowRightLeft as any, { size: 16, color: '#22c55e' })}
          </div>
        </div>
      </div>
    </div>
  );
}
