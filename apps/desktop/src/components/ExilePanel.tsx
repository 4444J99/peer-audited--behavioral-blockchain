import React, { useState } from 'react';
import { Skull, AlertTriangle, Key, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

export default function ExilePanel() {
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const handleExileRequest = () => {
    if (!targetId || !reason) return;
    setFeedback(null);
    setConfirmStep(true);
  };

  const handleConfirmExile = async () => {
    setIsAuthorizing(true);
    setFeedback(null);

    try {
      const result = await api.banUser(targetId, reason);
      if (result.success) {
        setFeedback({
          type: 'success',
          message: `Entity ${targetId} permanently exiled from Styx Protocol. Ban recorded in Truth Log.`,
        });
        setTargetId('');
        setReason('');
      } else {
        setFeedback({
          type: 'error',
          message: `Ban request for ${targetId} was rejected by the server.`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || `Failed to exile entity ${targetId}.`,
      });
    } finally {
      setIsAuthorizing(false);
      setConfirmStep(false);
    }
  };

  const handleCancelExile = () => {
    setConfirmStep(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626' }}>
        {React.createElement(Skull as any, { size: 18 })} Exile Execution Protocol
      </h2>

      {/* Feedback Banner */}
      {feedback && (
        <div style={{
          backgroundColor: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.1)',
          border: `1px solid ${feedback.type === 'success' ? '#22c55e' : '#DC2626'}`,
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: feedback.type === 'success' ? '#22c55e' : '#ff6666',
          fontSize: '0.9rem',
        }}>
          {feedback.type === 'success'
            ? React.createElement(CheckCircle as any, { size: 20 })
            : React.createElement(XCircle as any, { size: 20 })
          }
          {feedback.message}
        </div>
      )}

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
              disabled={confirmStep || isAuthorizing}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#000',
                border: '1px solid #333',
                color: '#fff',
                boxSizing: 'border-box',
                opacity: confirmStep ? 0.6 : 1,
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Reasoning (Truth Log Append)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Repeated Honeypot failures. Algorithmic bypass attempts."
              disabled={confirmStep || isAuthorizing}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#000',
                border: '1px solid #333',
                color: '#fff',
                boxSizing: 'border-box',
                opacity: confirmStep ? 0.6 : 1,
              }}
            />
          </div>
        </div>

        {/* Confirmation Dialog */}
        {confirmStep && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: 'rgba(220,38,38,0.15)',
            border: '2px solid #DC2626',
            borderRadius: '4px',
          }}>
            <p style={{ margin: '0 0 1rem', color: '#ff9999', fontWeight: 'bold' }}>
              CONFIRM EXILE: Are you sure you want to permanently ban entity "{targetId}"?
            </p>
            <p style={{ margin: '0 0 1rem', color: '#ff9999', fontSize: '0.85rem' }}>
              Reason: {reason}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleConfirmExile}
                disabled={isAuthorizing}
                style={{
                  backgroundColor: isAuthorizing ? '#666' : '#DC2626',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  fontWeight: 'bold',
                  cursor: isAuthorizing ? 'not-allowed' : 'pointer',
                }}
              >
                {isAuthorizing ? 'EXECUTING...' : 'CONFIRM BAN'}
              </button>
              <button
                onClick={handleCancelExile}
                disabled={isAuthorizing}
                style={{
                  backgroundColor: 'transparent',
                  color: '#aaa',
                  border: '1px solid #555',
                  padding: '0.75rem 1.5rem',
                  fontWeight: 'bold',
                  cursor: isAuthorizing ? 'not-allowed' : 'pointer',
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Initial Action Button */}
        {!confirmStep && (
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleExileRequest}
              disabled={!targetId || !reason || isAuthorizing}
              style={{
                backgroundColor: targetId && reason && !isAuthorizing ? '#DC2626' : '#333',
                color: targetId && reason && !isAuthorizing ? '#fff' : '#666',
                border: 'none', padding: '1rem 2rem', fontWeight: 'bold',
                cursor: targetId && reason && !isAuthorizing ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              {React.createElement(Key as any, { size: 16 })} EXECUTE BAN HAMMER
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
