import React, { useState } from 'react';
import { Fingerprint, Search, AlertCircle } from 'lucide-react';
import './HashCollider.css';

interface HashProof {
  id: string;
  pHash: string;
  user: string;
  contractId: string;
  timestamp: string;
  similarity: number;
}

export default function HashCollider() {
  const [isScanning, setIsScanning] = useState(false);
  const [collisions, setCollisions] = useState<{ origin: HashProof, duplicate: HashProof }[]>([]);

  const handleScan = () => {
    setIsScanning(true);
    // Mock simulation of pHash collision detection across the R2 storage metadata
    setTimeout(() => {
      setCollisions([
        {
          origin: { id: 'prf_1A', pHash: 'e1c3b1a20803c031', user: 'usr_alpha77', contractId: 'con_x1', timestamp: '2026-02-24T10:00:00Z', similarity: 100 },
          duplicate: { id: 'prf_2B', pHash: 'e1c3b1a20803c031', user: 'usr_beta99', contractId: 'con_x2', timestamp: '2026-02-25T08:30:00Z', similarity: 98.5 }
        }
      ]);
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div>
      <div className="hash-collider-header">
        <h2 className="hash-collider-title">
          {React.createElement(Fingerprint as any, { size: 18 })} Hash Collider (pHash Duplicate Detection)
        </h2>
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="scan-button"
        >
          {React.createElement(Search as any, { size: 14, className: isScanning ? 'scan-icon-spinning' : '' })}
          {isScanning ? 'MATRIX SCAN RUNNING...' : 'SCAN CLOUDFLARE R2 BUCKET'}
        </button>
      </div>

      <div className="info-box">
        <p className="info-text">
          This sub-system calculates perceptual hashes (pHash) against all uploaded media proofs in Cloudflare R2 to detect duplicate whistle-blower submissions across different user accounts.
        </p>

        {isScanning ? (
          <div className="scanning-state">
            <Fingerprint size={48} className="animate-pulse pulse-icon" />
            Cross-referencing 42,000+ hashes...
          </div>
        ) : collisions.length === 0 ? (
          <div className="no-collisions-state">
            No visual collisions detected in the current epoch.
          </div>
        ) : (
          <div className="collisions-list">
            {collisions.map((col, i) => (
              <div key={i} className="collision-item">
                <div className="collision-header">
                  <div className="collision-title">
                    <AlertCircle size={16} /> COLLISION DETECTED (Similarity: {col.duplicate.similarity}%)
                  </div>
                  <button className="ticket-button">
                    OPEN TICKETS
                  </button>
                </div>
                
                <div className="comparison-grid">
                  {/* Origin */}
                  <div className="origin-box">
                    <div className="box-label origin">Original Submission</div>
                    <div className="user-info">User: {col.origin.user}</div>
                    <div className="proof-id">Proof ID: {col.origin.id}</div>
                    <div className="phash-info">pHash: {col.origin.pHash}</div>
                  </div>

                  <div className="vs-divider">VS</div>

                  {/* Duplicate */}
                  <div className="duplicate-box">
                    <div className="box-label duplicate">Duplicate Detected</div>
                    <div className="user-info">User: {col.duplicate.user}</div>
                    <div className="proof-id">Proof ID: {col.duplicate.id}</div>
                    <div className="phash-info">pHash: {col.duplicate.pHash}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
