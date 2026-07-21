'use client';

import React, { useEffect, useState } from 'react';
import { Gift, Users, DollarSign, Clock, Copy, Check, Share2, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api-client';
import type { ReferralReward } from '@styx/shared/index';

export default function ReferralsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [stats, setStats] = useState<{
    totalReferrals: number;
    rewardedReferrals: number;
    pendingReferrals: number;
    totalRewardCents: number;
    rewards: ReferralReward[];
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    Promise.all([
      api.getReferralCode(),
      api.getReferralStats(),
    ]).then(([codeData, statsData]) => {
      setCode(codeData.code);
      setShareUrl(codeData.url);
      setStats(statsData);
    }).catch(() => {
      // Referral endpoint may 404 if not onboarded yet
    }).finally(() => {
      setLoading(false);
    });
  }, [user, authLoading]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">Loading...</span>
      </div>
    );
  }

  const earningsDollars = stats ? (stats.totalRewardCents / 100).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tighter uppercase text-red-500 flex items-center gap-3">
          <Gift size={28} /> Referral Program
        </h1>
        <p className="text-neutral-400 mt-2 max-w-xl">
          Invite friends to Styx. You both get $5 when they complete their first contract.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 max-w-3xl">
        <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
            <Share2 size={14} /> Your Referral Link
          </h2>

          {code ? (
            <>
              <div className="flex items-center gap-2 bg-neutral-800 rounded px-3 py-2 mb-3">
                <code className="text-lg font-mono text-red-400 flex-1 truncate">
                  {code}
                </code>
                <button
                  onClick={handleCopy}
                  className="text-neutral-400 hover:text-white transition-colors"
                  title="Copy referral link"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-xs text-neutral-500 break-all">{shareUrl}</p>
            </>
          ) : (
            <p className="text-neutral-500 text-sm">Generate your code by visiting this page.</p>
          )}
        </section>

        <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
            <DollarSign size={14} /> Your Earnings
          </h2>
          <p className="text-3xl font-black text-green-500">${earningsDollars}</p>
          <p className="text-xs text-neutral-500 mt-1">earned from referrals</p>
        </section>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4 max-w-3xl mt-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center">
            <Users size={20} className="mx-auto mb-2 text-neutral-400" />
            <p className="text-2xl font-black">{stats.totalReferrals}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Total</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center">
            <Check size={20} className="mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-black">{stats.rewardedReferrals}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Rewarded</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center">
            <Clock size={20} className="mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-black">{stats.pendingReferrals}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Pending</p>
          </div>
        </div>
      )}

      {stats && stats.rewards.length > 0 && (
        <section className="mt-10 max-w-3xl">
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-4">Reward History</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 uppercase tracking-wider text-xs">
                  <th className="text-left p-3">Friend</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Reward</th>
                  <th className="text-right p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.rewards.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-800/50">
                    <td className="p-3 text-neutral-300">{r.referredUserEmail}</td>
                    <td className="p-3">
                      <span className={`text-xs font-bold uppercase ${
                        r.status === 'REWARDED' ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right text-neutral-300">
                      ${(r.rewardAmountCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-neutral-500">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
