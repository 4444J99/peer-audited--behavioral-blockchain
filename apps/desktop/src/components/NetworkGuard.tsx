import React, { useState, useEffect } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import './NetworkGuard.css';

export default function NetworkGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'CHECKING' | 'SECURE' | 'BLOCKED'>('CHECKING');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Simulate VPN/Corporate IP Auth sequence
    const bootSequence = async () => {
      const addLog = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${msg}`]);
      
      addLog('Initiating network uplink...');
      await new Promise(r => setTimeout(r, 600));
      
      addLog('Verifying corporate VPN tunnel footprint...');
      await new Promise(r => setTimeout(r, 800));
      
      addLog('Validating static IP against approved ingress list...');
      await new Promise(r => setTimeout(r, 700));

      addLog('Tauri secure environment confirmed.');
      await new Promise(r => setTimeout(r, 400));
      
      setStatus('SECURE');
    };

    bootSequence();
  }, []);

  if (status === 'SECURE') {
    return <>{children}</>;
  }

  return (
    <div className="network-guard-container">
      <div className={`network-guard-card ${status === 'BLOCKED' ? 'blocked' : 'secure'}`}>
        <div className="network-guard-header">
          {status === 'CHECKING' ? (
            <Loader2 className="animate-spin" size={32} />
          ) : (
            <ShieldAlert size={32} color="#f00" />
          )}
          <h1 className={`network-guard-title ${status === 'BLOCKED' ? 'blocked' : ''}`}>
            STYX JUDGE / NETWORK AUTHENTICATION
          </h1>
        </div>

        <div className="logs-container">
          {logs.map((log, i) => (
            <div key={i} className={`log-item ${log.includes('Validating') ? 'validating' : ''}`}>
              {log}
            </div>
          ))}
          {status === 'CHECKING' && (
            <div className="awaiting-handshake">
              <span className="animate-pulse">_</span> AWAITING HANDSHAKE
            </div>
          )}
        </div>

        {status === 'BLOCKED' && (
          <div className="blocked-alert">
            ACCESS DENIED: Your current IP address is not recognized on the corporate VPN ingress list. The Judge terminal will not load outside a secure tunnel.
          </div>
        )}
      </div>
    </div>
  );
}
