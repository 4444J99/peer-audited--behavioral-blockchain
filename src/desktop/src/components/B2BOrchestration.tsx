import React, { useState } from 'react';
import { Building2, Plus, Copy } from 'lucide-react';

export default function B2BOrchestration() {
  const [keys] = useState([
    { id: 'key_prod_1a2', type: 'WEBHOOK_PUSH', company: 'ACME Corp', status: 'ACTIVE', created: '2026-02-01' },
    { id: 'key_test_9z8', type: 'DATA_LAKE_READ', company: 'Globex', status: 'REVOKED', created: '2026-01-15' }
  ]);

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
        {React.createElement(Building2 as any, { size: 18 })} Enterprise Orchestration
      </h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <p style={{ color: '#888', margin: 0 }}>API Key management for Phase Omega B2B external integrations.</p>
          <button style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '0.5rem 1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {React.createElement(Plus as any, { size: 14 })} GENERATE NEW KEY
          </button>
      </div>

      <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ paddingBottom: '1rem' }}>Client ID / Key Prefix</th>
              <th style={{ paddingBottom: '1rem' }}>Enterprise Entity</th>
              <th style={{ paddingBottom: '1rem' }}>Access Scope</th>
              <th style={{ paddingBottom: '1rem' }}>Created</th>
              <th style={{ paddingBottom: '1rem' }}>Status</th>
              <th style={{ paddingBottom: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {k.id} {React.createElement(Copy as any, { size: 12, style: { cursor: 'pointer' } })}
                </td>
                <td style={{ padding: '1rem 0', color: '#fff', fontWeight: 'bold' }}>{k.company}</td>
                <td style={{ padding: '1rem 0', color: '#aaa', fontSize: '0.9rem' }}>{k.type}</td>
                <td style={{ padding: '1rem 0', color: '#666', fontSize: '0.9rem' }}>{k.created}</td>
                <td style={{ padding: '1rem 0', fontSize: '0.8rem' }}>
                  <span style={{ backgroundColor: k.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.1)', color: k.status === 'ACTIVE' ? '#22c55e' : '#DC2626', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    {k.status}
                  </span>
                </td>
                <td style={{ padding: '1rem 0' }}>
                   {k.status === 'ACTIVE' && <button style={{ padding: '0.25rem 0.5rem', backgroundColor: '#333', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>REVOKE</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
