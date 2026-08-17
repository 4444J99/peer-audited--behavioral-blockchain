'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Lock, Unlock, X } from 'lucide-react';
import { api } from '../services/api-client';
import type { RecoveryBreakRequest } from '../services/api-client';

/**
 * Renders the remaining cooldown as `Hh MMm SSs`, rounding up so the display
 * never shows 0 while time is still owed.
 */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export interface RecoveryLockPanelProps {
  request: RecoveryBreakRequest | null;
  now: number;
  canRequestBreak: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  onRequestBreak: () => void;
  onCancel: () => void;
  requesting: boolean;
  cancelling: boolean;
  error: string | null;
  notice: string | null;
}

/**
 * The presentational half of the recovery timelock, split out so every branch
 * is renderable from fixed props (the same reason DashboardErrorNotice is its
 * own component): the container below owns fetching, the ticking clock, and
 * the two POSTs.
 */
export function RecoveryLockPanel({
  request,
  now,
  canRequestBreak,
  reason,
  onReasonChange,
  onRequestBreak,
  onCancel,
  requesting,
  cancelling,
  error,
  notice,
}: RecoveryLockPanelProps) {
  // UNLOCKED is derived by the API from unlock_at, not stored, so both live
  // states arrive on the same row and share this branch.
  const live =
    request !== null &&
    (request.status === 'PENDING_COOLDOWN' || request.status === 'UNLOCKED');
  const unlocked = request?.status === 'UNLOCKED';

  return (
    <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
      <div className="flex items-center gap-3">
        {unlocked ? (
          <Unlock className="text-red-500" size={20} />
        ) : (
          <Lock className="text-amber-500" size={20} />
        )}
        <h2 className="font-bold text-sm uppercase tracking-widest text-neutral-500">
          Break Timelock
        </h2>
      </div>

      {live && request !== null ? (
        <div className="space-y-4">
          {unlocked ? (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl">
              <p className="font-bold text-red-400">Cooldown complete</p>
              <p className="text-neutral-400 text-sm mt-1">
                The 24-hour hold on this break has expired. It is unlocked.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-amber-900/20 border border-amber-800 rounded-xl">
              <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                Unlocks in
              </p>
              <p className="text-4xl font-black tabular-nums text-amber-400">
                {formatCountdown(new Date(request.unlock_at).getTime() - now)}
              </p>
              <p className="text-neutral-400 text-sm mt-2">
                Unlocks {new Date(request.unlock_at).toLocaleString()}
              </p>
            </div>
          )}

          {request.reason && (
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                Your stated reason
              </p>
              <p className="text-sm text-neutral-300">{request.reason}</p>
            </div>
          )}

          {/* Cancel stays available after the countdown ends: the row is still
              stored as PENDING_COOLDOWN, so the API accepts a cancel right up
              until the break is consumed. */}
          <button
            onClick={onCancel}
            disabled={cancelling}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {cancelling ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />}
            Cancel Break Request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-neutral-400 text-sm">
            Breaking a recovery contract is deliberate, never immediate. A
            request sits behind a 24-hour cooldown you can cancel at any point.
          </p>
          {request?.status === 'CANCELLED' && (
            <p className="text-xs text-neutral-500">
              Last request cancelled &mdash; requested {new Date(request.requested_at).toLocaleString()}.
            </p>
          )}
          {request?.status === 'CONSUMED' && (
            <p className="text-xs text-neutral-500">
              Last break used &mdash; requested {new Date(request.requested_at).toLocaleString()}.
            </p>
          )}
          {canRequestBreak ? (
            <>
              <textarea
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                rows={3}
                placeholder="Why do you want to break this contract?"
                className="w-full px-4 py-3 bg-black border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-amber-600"
              />
              <button
                onClick={onRequestBreak}
                disabled={requesting || !reason.trim()}
                className="w-full py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {requesting ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
                Request Break
              </button>
            </>
          ) : (
            <p className="text-xs text-neutral-500">
              A break can only be requested while the contract is active.
            </p>
          )}
        </div>
      )}

      {notice && <p className="text-sm text-neutral-400">{notice}</p>}
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Recovery timelock surface (TKT-P1-005) for a single RECOVERY_* contract:
 * the live cooldown, the request CTA, and the cancel CTA.
 */
export default function RecoveryLockCountdown({
  contractId,
  canRequestBreak,
}: {
  contractId: string;
  canRequestBreak: boolean;
}) {
  const [request, setRequest] = useState<RecoveryBreakRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    const status = await api.getRecoveryLockStatus(contractId);
    setRequest(status.activeRequest);
    setNow(Date.now());
  }, [contractId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const status = await api.getRecoveryLockStatus(contractId);
        if (cancelled) return;
        setRequest(status.activeRequest);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load timelock status');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  useEffect(() => {
    if (!request || request.status !== 'PENDING_COOLDOWN') return;
    const unlockAt = new Date(request.unlock_at).getTime();
    const timer = setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      if (tick >= unlockAt) {
        clearInterval(timer);
        // The UNLOCKED transition belongs to the server, so an expiring
        // countdown asks for the authoritative status instead of relabelling
        // the row from the browser's clock.
        void refresh().catch(() => undefined);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [request, refresh]);

  const handleRequestBreak = async () => {
    setRequesting(true);
    setError(null);
    setNotice(null);
    try {
      const created = await api.requestRecoveryBreak(contractId, reason.trim());
      setRequest(created);
      setReason('');
      setNow(Date.now());
      setNotice('Break queued. The 24-hour cooldown has started.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request break');
    } finally {
      setRequesting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.cancelRecoveryBreak(contractId);
      setRequest(result.request);
      setNotice('Break request cancelled. Your contract stands.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel break request');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse">
        <div className="h-4 w-32 bg-neutral-800 rounded mb-4" />
        <div className="h-12 w-full bg-neutral-800 rounded" />
      </div>
    );
  }

  return (
    <RecoveryLockPanel
      request={request}
      now={now}
      canRequestBreak={canRequestBreak}
      reason={reason}
      onReasonChange={setReason}
      onRequestBreak={handleRequestBreak}
      onCancel={handleCancel}
      requesting={requesting}
      cancelling={cancelling}
      error={error}
      notice={notice}
    />
  );
}
