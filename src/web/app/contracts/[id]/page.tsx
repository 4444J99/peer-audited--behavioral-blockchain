'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Loader2, AlertTriangle,
  Send, Calendar, Shield, FileText,
} from 'lucide-react';
import { api } from '../../../services/api-client';
import { useAuth } from '../../../contexts/AuthContext';

type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'PENDING_REVIEW' | 'PAYMENT_FAILED' | 'DISPUTED';

interface ContractData {
  id: string;
  user_id: string;
  oath_category: string;
  verification_method: string;
  stake_amount: string;
  status: ContractStatus;
  duration_days: number;
  started_at: string;
  ends_at: string;
  created_at: string;
  email: string;
  integrity_score: number;
}

interface Proof {
  id: string;
  status: string;
  media_uri: string;
  submitted_at: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  ACTIVE: { color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-800', icon: Clock, label: 'Active' },
  COMPLETED: { color: 'text-green-400', bg: 'bg-green-900/30 border-green-800', icon: CheckCircle, label: 'Completed' },
  FAILED: { color: 'text-red-400', bg: 'bg-red-900/30 border-red-800', icon: XCircle, label: 'Failed' },
  PENDING_REVIEW: { color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800', icon: Shield, label: 'Pending Review' },
  PAYMENT_FAILED: { color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-800', icon: AlertTriangle, label: 'Payment Failed' },
  DISPUTED: { color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-800', icon: FileText, label: 'Disputed' },
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const contractId = params.id as string;

  const [contract, setContract] = useState<ContractData | null>(null);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Proof submission
  const [mediaUri, setMediaUri] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  // Grace day
  const [graceLoading, setGraceLoading] = useState(false);
  const [graceResult, setGraceResult] = useState<string | null>(null);

  // Dispute
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeResult, setDisputeResult] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    async function load() {
      try {
        const contractData = await api.getContract(contractId);
        setContract(contractData as unknown as ContractData);

        // Try to load proofs (endpoint may not exist yet)
        try {
          const proofData = await api.getContractProofs(contractId);
          setProofs(proofData);
        } catch {
          // Proofs endpoint not available — no-op
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contract');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contractId, authUser, authLoading, router]);

  const handleSubmitProof = async () => {
    if (!mediaUri.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const result = await api.submitProof(contractId, { mediaUri });
      if (result.rejected) {
        setSubmitResult(`Auto-rejected: ${result.reason}`);
      } else {
        setSubmitResult(`Proof submitted (ID: ${result.proofId}). Routed to Fury network.`);
        setMediaUri('');
        setContract((prev) => prev ? { ...prev, status: 'PENDING_REVIEW' as ContractStatus } : prev);
      }
    } catch (err) {
      setSubmitResult(err instanceof Error ? err.message : 'Failed to submit proof');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGraceDay = async () => {
    setGraceLoading(true);
    setGraceResult(null);
    try {
      const result = await api.useGraceDay(contractId);
      setGraceResult(`Deadline extended to ${new Date(result.newDeadline).toLocaleDateString()}`);
      setContract((prev) => prev ? { ...prev, ends_at: result.newDeadline } : prev);
    } catch (err) {
      setGraceResult(err instanceof Error ? err.message : 'Failed to use grace day');
    } finally {
      setGraceLoading(false);
    }
  };

  const handleDispute = async () => {
    setDisputeLoading(true);
    setDisputeResult(null);
    try {
      const result = await api.disputeContract(contractId);
      setDisputeResult(`Appeal filed (${result.appealStatus}). $5 appeal fee authorized.`);
    } catch (err) {
      setDisputeResult(err instanceof Error ? err.message : 'Failed to file dispute');
    } finally {
      setDisputeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">Loading contract...</span>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="mx-auto text-red-500" size={48} />
          <p className="text-red-400 font-bold">{error || 'Contract not found'}</p>
          <Link href="/dashboard" className="text-neutral-400 hover:text-white underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.ACTIVE;
  const StatusIcon = statusCfg.icon;
  const stakeAmount = Number(contract.stake_amount);
  const endsAt = new Date(contract.ends_at);
  const startedAt = new Date(contract.started_at);
  const now = new Date();
  const totalMs = endsAt.getTime() - startedAt.getTime();
  const elapsedMs = Math.min(now.getTime() - startedAt.getTime(), totalMs);
  const progressPct = totalMs > 0 ? Math.round((elapsedMs / totalMs) * 100) : 0;
  const daysRemaining = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight uppercase">
            {contract.oath_category.replace(/_/g, ' ')}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {contract.verification_method.replace(/_/g, ' ')} &bull; Contract {contract.id.slice(0, 8)}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full border ${statusCfg.bg} flex items-center gap-2`}>
          <StatusIcon size={16} className={statusCfg.color} />
          <span className={`font-bold text-sm ${statusCfg.color}`}>{statusCfg.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stake & Timeline */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-6">
          <div>
            <h2 className="text-neutral-500 font-bold tracking-widest text-xs mb-2">STAKE AMOUNT</h2>
            <p className="text-4xl font-black">
              <span className="text-red-500">$</span>{stakeAmount.toFixed(2)}
            </p>
          </div>

          <div>
            <h2 className="text-neutral-500 font-bold tracking-widest text-xs mb-3">TIMELINE</h2>
            <div className="flex justify-between text-xs text-neutral-500 mb-2">
              <span>{startedAt.toLocaleDateString()}</span>
              <span>{endsAt.toLocaleDateString()}</span>
            </div>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  contract.status === 'COMPLETED' ? 'bg-green-500' :
                  contract.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(progressPct, 100)}%` }}
              />
            </div>
            {contract.status === 'ACTIVE' && (
              <p className="text-neutral-400 text-sm mt-2">
                <Clock size={14} className="inline mr-1" />
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-500">Duration</span>
              <p className="font-bold">{contract.duration_days} days</p>
            </div>
            <div>
              <span className="text-neutral-500">Created</span>
              <p className="font-bold">{new Date(contract.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-6">
          {/* Status banners */}
          {contract.status === 'COMPLETED' && (
            <div className="p-4 bg-green-900/20 border border-green-800 rounded-xl">
              <CheckCircle className="text-green-400 mb-2" size={24} />
              <p className="font-bold text-green-400">Contract Fulfilled</p>
              <p className="text-neutral-400 text-sm mt-1">${stakeAmount.toFixed(2)} returned to your wallet.</p>
            </div>
          )}

          {contract.status === 'FAILED' && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl space-y-3">
              <div>
                <XCircle className="text-red-400 mb-2" size={24} />
                <p className="font-bold text-red-400">Contract Failed</p>
                <p className="text-neutral-400 text-sm mt-1">${stakeAmount.toFixed(2)} has been captured.</p>
              </div>
              <button
                onClick={handleDispute}
                disabled={disputeLoading}
                className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {disputeLoading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                File Dispute ($5 Appeal Fee)
              </button>
              {disputeResult && (
                <p className="text-sm text-neutral-400">{disputeResult}</p>
              )}
            </div>
          )}

          {contract.status === 'PENDING_REVIEW' && (
            <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-xl">
              <Shield className="text-blue-400 mb-2" size={24} />
              <p className="font-bold text-blue-400">Awaiting Fury Verdict</p>
              <p className="text-neutral-400 text-sm mt-1">Your proof is being reviewed by the Fury network.</p>
            </div>
          )}

          {/* Proof Submission — only when ACTIVE */}
          {contract.status === 'ACTIVE' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-widest text-neutral-500">Submit Proof</h3>
              <input
                type="text"
                value={mediaUri}
                onChange={(e) => setMediaUri(e.target.value)}
                placeholder="r2://styx-fury-proofs/your-proof.mp4"
                className="w-full px-4 py-3 bg-black border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-red-600"
              />
              <button
                onClick={handleSubmitProof}
                disabled={submitting || !mediaUri.trim()}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                Submit Proof
              </button>
              {submitResult && (
                <p className="text-sm text-neutral-400">{submitResult}</p>
              )}

              {/* Grace Day */}
              <button
                onClick={handleGraceDay}
                disabled={graceLoading}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {graceLoading ? <Loader2 className="animate-spin" size={16} /> : <Calendar size={16} />}
                Use Grace Day (+24h)
              </button>
              {graceResult && (
                <p className="text-sm text-neutral-400">{graceResult}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Proof History */}
      {proofs.length > 0 && (
        <div className="mt-8 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <h2 className="font-bold text-sm uppercase tracking-widest text-neutral-500 mb-4">Proof History</h2>
          <div className="space-y-3">
            {proofs.map((proof) => (
              <div key={proof.id} className="flex items-center justify-between p-3 bg-black rounded-xl border border-neutral-800">
                <div>
                  <p className="font-bold text-sm">{proof.id.slice(0, 12)}...</p>
                  <p className="text-xs text-neutral-500">
                    {proof.submitted_at ? new Date(proof.submitted_at).toLocaleString() : 'Pending'}
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  proof.status === 'VERIFIED' ? 'bg-green-900/30 text-green-400' :
                  proof.status === 'REJECTED' ? 'bg-red-900/30 text-red-400' :
                  proof.status === 'AUTO_REJECTED' ? 'bg-orange-900/30 text-orange-400' :
                  'bg-blue-900/30 text-blue-400'
                }`}>
                  {proof.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
