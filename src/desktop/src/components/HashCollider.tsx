import React, { useState } from 'react';
import { Fingerprint, Search, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
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
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const result = await api.scanHashCollisions();
      setCollisions(result.collisions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
      setCollisions([]);
    } finally {
      setIsScanning(false);
    }
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

        {error ? (
          <div className="error-state">
            <AlertCircle size={16} /> {error}
          </div>
        ) : isScanning ? (
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
