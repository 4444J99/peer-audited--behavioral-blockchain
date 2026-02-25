'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Eye, ShieldAlert, CheckCircle, Target, Loader2, AlertTriangle, Inbox, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { useFuryStore } from '../../store/useFuryStore';

interface FuryStats {
  totalAudits: number;
  successfulAudits: number;
  falseAccusations: number;
  accuracy: number;
  totalBountiesEarned: number;
  totalPenaltiesPaid: number;
  netEarnings: number;
  honeypotsCaught: number;
  honeypotsFailedOn: number;
}

export default function FuryWorkbench() {
  const { user: authUser, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Zustand State
  const { assignments, isConnected, error: streamError, connectStream, disconnectStream, removeAssignment } = useFuryStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [stats, setStats] = useState<FuryStats | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getFuryStats();
      setStats(data);
    } catch {
      // Stats are non-critical
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    
    // Connect to SSE stream
    connectStream();
    loadStats();

    return () => {
      disconnectStream();
    };
  }, [authUser, authLoading, router, connectStream, disconnectStream, loadStats]);

  const handleLogout = () => {
    disconnectStream();
    logout();
    router.push('/login');
  };

  const handleVerdict = async (verdict: 'PASS' | 'FAIL') => {
    const current = assignments[currentIndex];
    if (!current) return;

    setSubmitting(true);
    setActionError(null);
    try {
      await api.submitVerdict({
        assignmentId: current.assignment_id,
        verdict,
      });
      // Remove from store immediately for snappy UI
      removeAssignment(current.assignment_id);
      
      // Update UI index if necessary
      if (currentIndex >= assignments.length - 1) {
        setCurrentIndex(Math.max(0, assignments.length - 2)); // Shift back if we were at the end
      }
      
      // Refresh stats after a judgement
      loadStats();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to submit verdict');
    } finally {
      setSubmitting(false);
    }
  };

  const current = assignments[currentIndex];
  const queueCount = assignments.length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">Authenticating...</span>
      </div>
    );
  }

  if (streamError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="mx-auto text-red-500" size={48} />
          <p className="text-red-400 font-bold">{streamError}</p>
          <p className="text-neutral-500 text-sm">Attempting to reconnect to The Panopticon...</p>
          <button onClick={connectStream} className="px-6 py-2 bg-neutral-800 rounded-lg text-sm font-bold hover:bg-neutral-700 transition-colors mt-4">
            FORCE RECONNECT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-red-900/40 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-none flex items-center justify-center -rotate-12 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            <Eye className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-red-500">The Panopticon</h1>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Fury Peer Review Pipeline</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-right">
            <p className="text-xs text-neutral-500">Queue Depth</p>
            <p className="font-black text-lime-400">{queueCount}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Disconnect and Logout"
            title="Disconnect and Logout"
            className="px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800 text-sm font-bold text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Fury Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          <div className="px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Audits</p>
            <p className="font-black text-lg text-white">{stats.totalAudits}</p>
          </div>
          <div className="px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Accuracy</p>
            <p className="font-black text-lg text-lime-400">{(stats.accuracy * 100).toFixed(1)}%</p>
          </div>
          <div className="px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Net Earnings</p>
            <p className={`font-black text-lg ${stats.netEarnings >= 0 ? 'text-lime-400' : 'text-red-500'}`}>
              ${stats.netEarnings.toFixed(2)}
            </p>
          </div>
          <div className="px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Bounties</p>
            <p className="font-black text-lg text-lime-400">${stats.totalBountiesEarned.toFixed(2)}</p>
          </div>
          <div className="px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Honeypots Caught</p>
            <p className="font-black text-lg text-white">{stats.honeypotsCaught}</p>
          </div>
          <div className="px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Penalties</p>
            <p className="font-black text-lg text-red-500">${stats.totalPenaltiesPaid.toFixed(2)}</p>
          </div>
        </div>
      )}

      {!current ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Inbox className="mx-auto text-neutral-600" size={64} />
            <p className="text-neutral-500 font-bold text-lg">Queue Empty</p>
            <p className="text-neutral-600 text-sm">
              No proofs awaiting review. The Panopticon is actively scanning... <br />
              <span className="text-lime-500/50 mt-2 inline-block">● Live Connection Active</span>
            </p>
          </div>
        </div>
      ) : (
        <main className="flex-1 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player & Evidence */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="w-full aspect-video bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden relative group">
              {current.media_uri ? (
                <video
                  src={current.media_uri}
                  controls
                  className="w-full h-full object-contain"
                  playsInline
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-neutral-700 font-bold tracking-widest">[ NO MEDIA AVAILABLE ]</span>
                </div>
              )}

              {/* Meta Overlay */}
              <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
                <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-bold text-white border border-white/10 uppercase tracking-wider">
                  Proof: {current.proof_id.slice(0, 8)}
                </span>
                <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-bold text-white border border-white/10">
                  Submitted: {new Date(current.submitted_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
              <h3 className="font-bold text-neutral-400 mb-2 uppercase text-xs tracking-widest">Assignment Details</h3>
              <p className="text-white text-sm">
                <span className="text-neutral-500">Contract:</span> {current.contract_id.slice(0, 8)}...
                <span className="text-neutral-500 ml-4">Assigned:</span> {new Date(current.assigned_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Voting Panel */}
          <div className="space-y-4 flex flex-col h-full">
            <div className="p-6 bg-neutral-900 rounded-2xl border border-neutral-800 flex-1 flex flex-col">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                <Target size={20} className="text-red-500" /> Cast Judgment
              </h2>

              <p className="text-sm text-neutral-400 mb-8">
                Analyze the evidence. If the user successfully completed the habit parameters, hit VERIFY. If they are forging, stalling, or failing, hit BURN.
                <br /><br />
                <strong className="text-red-500">WARNING:</strong> If you verify a Honeypot (fake proof) your entire grading score will drop and you will incur a financial penalty.
              </p>

              <div className="mt-auto space-y-4">
                <button
                  onClick={() => handleVerdict('PASS')}
                  disabled={submitting}
                  className="w-full py-5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 text-green-400 font-black rounded-xl transition-all flex justify-center items-center gap-2 text-lg disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle size={24} />}
                  VERIFY PROOF
                </button>

                <button
                  onClick={() => handleVerdict('FAIL')}
                  disabled={submitting}
                  className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all flex justify-center items-center gap-2 shadow-[0_0_30px_rgba(220,38,38,0.3)] text-lg disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={24} className="animate-spin" /> : <ShieldAlert size={24} />}
                  BURN STAKE (FRAUD)
                </button>
              </div>
            </div>

            <Link href="/dashboard" className="w-full py-4 text-center text-neutral-500 hover:text-white font-bold text-sm bg-neutral-900 border border-neutral-800 rounded-xl transition-colors block">
              EXIT PANOPTICON
            </Link>
          </div>
        </main>
      )}
    </div>
  );
}
