'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, AlertTriangle, ShieldCheck, User, Calendar, Activity, FileCheck,
} from 'lucide-react';
import { api } from '../../services/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { getAllowedTiers } from '../../../shared/libs/integrity';

interface HistoryEntry {
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface ContractSummary {
  completed: number;
  failed: number;
  active: number;
  total: number;
  completionRate: number;
}

export default function ProfilePage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [contracts, setContracts] = useState<ContractSummary>({ completed: 0, failed: 0, active: 0, total: 0, completionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !authUser) return;
    async function load() {
      try {
        const [historyData, contractData] = await Promise.all([
          api.getIntegrityHistory(),
          api.getUserContracts(),
        ]);
        setHistory(historyData);

        const completed = contractData.filter((c) => c.status === 'COMPLETED').length;
        const failed = contractData.filter((c) => c.status === 'FAILED').length;
        const active = contractData.filter((c) => c.status === 'ACTIVE').length;
        const total = contractData.length;
        const settled = completed + failed;
        setContracts({
          completed,
          failed,
          active,
          total,
          completionRate: settled > 0 ? Math.round((completed / settled) * 100) : 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authUser, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">Loading profile...</span>
      </div>
    );
  }

  if (error || !authUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="mx-auto text-red-500" size={48} />
          <p className="text-red-400 font-bold">{error || 'Not authenticated'}</p>
          <Link href="/dashboard" className="text-neutral-400 hover:text-white underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const score = authUser.integrity_score;
  const tiers = getAllowedTiers(score);
  const topTier = tiers[tiers.length - 1];

  const EVENT_LABELS: Record<string, string> = {
    CONTRACT_CREATED: 'Contract Created',
    PROOF_SUBMITTED: 'Proof Submitted',
    PROOF_AUTO_REJECTED: 'Proof Auto-Rejected',
    CONTRACT_RESOLVED: 'Contract Resolved',
    CONSENSUS_REACHED: 'Fury Consensus',
    GRACE_DAY_USED: 'Grace Day Used',
    APPEAL_INITIATED: 'Appeal Filed',
    FURY_VERDICT: 'Fury Verdict',
    ONBOARDING_BONUS_GRANTED: 'Onboarding Bonus',
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-black tracking-tight uppercase">Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identity Card */}
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <User size={28} className="text-black" />
            </div>
            <div>
              <p className="font-bold text-lg">{authUser.email}</p>
              <p className="text-neutral-500 text-sm uppercase tracking-widest">{authUser.role || 'USER'}</p>
            </div>
          </div>

          <div>
            <h2 className="text-neutral-500 font-bold tracking-widest text-xs mb-2">INTEGRITY SCORE</h2>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black">{score}</span>
              <ShieldCheck size={24} className={
                score >= 100 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'
              } />
            </div>
            <p className="text-neutral-500 text-sm mt-1">
              {topTier?.replace(/_/g, ' ') || 'RESTRICTED'}
            </p>
          </div>

          <div className="text-sm text-neutral-500">
            <Calendar size={14} className="inline mr-1" />
            Member since {new Date(authUser.created_at || '').toLocaleDateString()}
          </div>
        </div>

        {/* Contract Summary */}
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl space-y-6">
          <h2 className="font-bold uppercase tracking-widest text-sm text-neutral-500">Contract Summary</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black rounded-xl border border-neutral-800 text-center">
              <p className="text-2xl font-black text-green-400">{contracts.completed}</p>
              <p className="text-xs text-neutral-500">Completed</p>
            </div>
            <div className="p-4 bg-black rounded-xl border border-neutral-800 text-center">
              <p className="text-2xl font-black text-red-400">{contracts.failed}</p>
              <p className="text-xs text-neutral-500">Failed</p>
            </div>
            <div className="p-4 bg-black rounded-xl border border-neutral-800 text-center">
              <p className="text-2xl font-black text-yellow-400">{contracts.active}</p>
              <p className="text-xs text-neutral-500">Active</p>
            </div>
            <div className="p-4 bg-black rounded-xl border border-neutral-800 text-center">
              <p className="text-2xl font-black">{contracts.completionRate}%</p>
              <p className="text-xs text-neutral-500">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="mt-8 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="text-neutral-500" size={20} />
          <h2 className="font-bold uppercase tracking-widest text-sm text-neutral-500">Audit Trail</h2>
        </div>

        {history.length === 0 ? (
          <p className="text-neutral-600 text-center py-8">No activity yet.</p>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 30).map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-black rounded-xl border border-neutral-800">
                <div className="flex items-center gap-3">
                  <FileCheck size={14} className="text-neutral-500" />
                  <div>
                    <p className="font-bold text-sm">
                      {EVENT_LABELS[entry.event_type] || entry.event_type.replace(/_/g, ' ')}
                    </p>
                    {entry.payload?.contractId ? (
                      <p className="text-xs text-neutral-600">
                        Contract: {String(entry.payload.contractId).slice(0, 8)}...
                      </p>
                    ) : null}
                  </div>
                </div>
                <span className="text-xs text-neutral-500">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
