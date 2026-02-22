import React, { useState } from 'react';
import { Skull, AlertTriangle, Key } from 'lucide-react';

export default function ExilePanel() {
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleExile = () => {
    setIsAuthorizing(true);
    // In production, this fires the ModerationService `banUser` endpoint.
    setTimeout(() => {
      alert(`SYSTEM DIRECTIVE: Entity ${targetId} permanently exiled from Styx Protocol.`);
      setIsAuthorizing(false);
      setTargetId('');
      setReason('');
    }, 1500);
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626' }}>
        {React.createElement(Skull as any, { size: 18 })} Exile Execution Protocol
      </h2>

      <div style={{ backgroundColor: '#180000', border: '1px solid #DC2626', padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
          {React.createElement(AlertTriangle as any, { size: 24, color: '#DC2626' })}
          <div>
            <h3 style={{ margin: 0, color: '#DC2626', fontWeight: 'bold' }}>Permanent Network Ban</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#ff9999', fontSize: '0.9rem' }}>
              Executing this function permanently burns the target's active stakes, blacklists their hardware identifier, 
              and blocks future Stripe authorizations. This action is irreversible.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Target Entity ID</label>
            <input 
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="e.g. usr_xyz123" 
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', border: '1px solid #333', color: '#fff' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Reasoning (Truth Log Append)</label>
            <input 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Repeated Honeypot failures. Algorithmic bypass attempts." 
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', border: '1px solid #333', color: '#fff' }} 
            />
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
             <button 
                onClick={handleExile}
                disabled={!targetId || isAuthorizing}
                style={{ 
                    backgroundColor: targetId && !isAuthorizing ? '#DC2626' : '#333', 
                    color: targetId && !isAuthorizing ? '#fff' : '#666', 
                    border: 'none', padding: '1rem 2rem', fontWeight: 'bold', cursor: targetId && !isAuthorizing ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
             >
                {React.createElement(Key as any, { size: 16 })} {isAuthorizing ? 'AUTHORIZING...' : 'EXECUTE BAN HAMMER'}
             </button>
        </div>
      </div>
    </div>
  );
}
