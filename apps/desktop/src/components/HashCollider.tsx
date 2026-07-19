import { useMemo, useState } from 'react';
import { Fingerprint, Search, AlertCircle, Copy, SlidersHorizontal } from 'lucide-react';
import { api } from '../services/api';
import {
  buildCollisionTicketDraft,
  classifyCollisionSeverity,
  filterCollisionsByThreshold,
  getCollisionSimilarity,
  normalizeCollisionList,
  type HashCollision,
} from './hash-collider.utils';
import './HashCollider.css';

export default function HashCollider() {
  const [isScanning, setIsScanning] = useState(false);
  const [collisions, setCollisions] = useState<HashCollision[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(95);
  const [feedback, setFeedback] = useState<string | null>(null);

  const visibleCollisions = useMemo(
    () => filterCollisionsByThreshold(collisions, similarityThreshold),
    [collisions, similarityThreshold],
  );

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await api.scanHashCollisions();
      setCollisions(normalizeCollisionList(result.collisions || []));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
      setCollisions([]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopyTicketDraft = async (collision: HashCollision) => {
    setFeedback(null);
    const draft = buildCollisionTicketDraft(collision);
    try {
      if (!globalThis.navigator?.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable in current runtime.');
      }
      await globalThis.navigator.clipboard.writeText(draft);
      setFeedback(`Ticket draft copied for ${collision.duplicate.id}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to copy ticket draft.';
      setFeedback(message);
    }
  };

  return (
    <div>
      <div className="hash-collider-header">
        <h2 className="hash-collider-title">
          <Fingerprint size={18} /> Hash Collider (pHash Duplicate Detection)
        </h2>
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="scan-button"
        >
          <Search size={14} className={isScanning ? 'scan-icon-spinning' : ''} />
          {isScanning ? 'MATRIX SCAN RUNNING...' : 'SCAN CLOUDFLARE R2 BUCKET'}
        </button>
      </div>

      <div className="info-box">
        <p className="info-text">
          This sub-system calculates perceptual hashes (pHash) against all uploaded media proofs in Cloudflare R2 to detect duplicate whistle-blower submissions across different user accounts.
        </p>

        <div className="threshold-controls">
          <div className="threshold-label-row">
            <div className="threshold-label">
              <SlidersHorizontal size={14} /> Similarity Threshold
            </div>
            <div className="threshold-value">{similarityThreshold}%</div>
          </div>
          <input
            type="range"
            min={80}
            max={100}
            step={1}
            value={similarityThreshold}
            onChange={(event) => setSimilarityThreshold(Number(event.target.value))}
            className="threshold-slider"
            aria-label="Similarity threshold"
          />
          <div className="threshold-caption">
            Showing {visibleCollisions.length} of {collisions.length} detected collisions.
          </div>
        </div>

        {feedback ? <div className="feedback-state">{feedback}</div> : null}

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
        ) : visibleCollisions.length === 0 ? (
          <div className="no-collisions-state">
            Collisions exist but none pass the current {similarityThreshold}% threshold.
          </div>
        ) : (
          <div className="collisions-list">
            {visibleCollisions.map((collision, index) => {
              const similarity = getCollisionSimilarity(collision);
              const severity = classifyCollisionSeverity(similarity);

              return (
                <div key={`${collision.origin.id}:${collision.duplicate.id}:${index}`} className={`collision-item severity-${severity}`}>
                  <div className="collision-header">
                    <div className="collision-title">
                      <AlertCircle size={16} />
                      COLLISION DETECTED ({similarity.toFixed(2)}%)
                      <span className={`severity-chip severity-${severity}`}>{severity.toUpperCase()}</span>
                    </div>
                    <button className="ticket-button" onClick={() => handleCopyTicketDraft(collision)}>
                      <Copy size={12} /> COPY TICKET DRAFT
                    </button>
                  </div>

                  <div className="comparison-grid">
                    <div className="origin-box">
                      <div className="box-label origin">Original Submission</div>
                      <div className="user-info">User: {collision.origin.user}</div>
                      <div className="proof-id">Proof ID: {collision.origin.id}</div>
                      <div className="proof-id">Contract: {collision.origin.contractId}</div>
                      <div className="proof-id">Captured: {collision.origin.timestamp}</div>
                      <div className="phash-info">pHash: {collision.origin.pHash}</div>
                    </div>

                    <div className="vs-divider">VS</div>

                    <div className="duplicate-box">
                      <div className="box-label duplicate">Duplicate Detected</div>
                      <div className="user-info">User: {collision.duplicate.user}</div>
                      <div className="proof-id">Proof ID: {collision.duplicate.id}</div>
                      <div className="proof-id">Contract: {collision.duplicate.contractId}</div>
                      <div className="proof-id">Captured: {collision.duplicate.timestamp}</div>
                      <div className="phash-info">pHash: {collision.duplicate.pHash}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
