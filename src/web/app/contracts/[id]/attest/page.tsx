'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Flame, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../../services/api-client';

interface AttestationStatus {
  contract_id: string;
  oath_category: string;
  streak_days: number;
  days_remaining: number;
  grace_days_available: number;
  today_attested: boolean;
  total_strikes: number;
}

export default function AttestPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;
  const [status, setStatus] = useState<AttestationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const data = await api.getAttestationStatus(contractId);
        setStatus(data as any);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attestation status');
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [contractId]);

  const handleAttest = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await api.submitAttestation(contractId);
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit attestation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <header className="flex items-center gap-4 mb-12 border-b border-neutral-800 pb-6">
        <Link href={`/contracts/${contractId}`} className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
            <Shield className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Daily Attestation</h1>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Recovery Protocol Check-In</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto space-y-8">
        {status && !confirmed && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-amber-500">{status.streak_days}</p>
                <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Day Streak</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-white">{status.days_remaining}</p>
                <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Days Left</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-neutral-400">{status.grace_days_available}</p>
                <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Grace Days</p>
              </div>
            </div>

            {status.total_strikes > 0 && (
              <div className="p-3 bg-red-600/10 border border-red-600/30 rounded-xl text-center">
                <p className="text-sm text-red-400 font-bold">{status.total_strikes} missed attestation{status.total_strikes > 1 ? 's' : ''} — {3 - status.total_strikes} remaining before auto-fail</p>
              </div>
            )}

            {status.today_attested ? (
              <div className="p-8 bg-green-900/20 border border-green-600/30 rounded-xl text-center">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <p className="text-lg font-black text-green-400">Already attested today</p>
                <p className="text-sm text-neutral-500 mt-2">Check back tomorrow for your next check-in.</p>
              </div>
            ) : (
              <>
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                  <p className="text-xl font-bold text-white mb-2">Did you maintain your commitment today?</p>
                  <p className="text-sm text-neutral-500">Your accountability partner will be notified to co-sign.</p>
                </div>

                <button
                  onClick={handleAttest}
                  disabled={submitting}
                  className="w-full py-5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-black font-black rounded-xl transition-colors text-lg flex justify-center items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      CONFIRMING...
                    </>
                  ) : (
                    <>
                      <Flame size={24} />
                      I HELD THE LINE
                    </>
                  )}
                </button>
              </>
            )}
          </>
        )}

        {confirmed && (
          <div className="p-8 bg-green-900/20 border border-green-600/30 rounded-xl text-center">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <p className="text-xl font-black text-green-400 mb-2">Attestation Recorded</p>
            <p className="text-sm text-neutral-500">Your accountability partner has been notified to co-sign.</p>
            <button
              onClick={() => router.push(`/contracts/${contractId}`)}
              className="mt-6 px-6 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-bold hover:bg-neutral-800 transition-colors"
            >
              Back to Contract
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-xl text-red-400 text-sm font-bold">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
