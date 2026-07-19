'use client';

import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Flame, History, User, Loader2, AlertTriangle, LogOut, Bell, Settings, ScrollText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api-client';
import { useAuth } from '../../contexts/AuthContext';
import Leaderboard from '../../components/Leaderboard';
import NotificationPanel from '../../components/NotificationPanel';
import { OnboardingWizard } from '../../components/OnboardingWizard';

interface BalanceData {
  id: string;
  email: string;
  integrity_score: number;
  allowed_tiers: string[];
  ledger_balance: number;
  status: string;
}

interface Transaction {
  id: string;
  amount: number;
  timestamp: string;
  type: string;
  description: string;
}

interface Contract {
  id: string;
  oath_category: string;
  stake_amount: string;
  status: string;
  ends_at: string;
}

export default function IdentityDashboard() {
  const { user: authUser, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (authLoading || !authUser) return;
    async function load() {
      try {
        const [balanceData, historyData, contractData] = await Promise.all([
          api.getBalance() as any,
          api.getHistory(10) as any,
          api.getUserContracts() as any,
        ]);
        setBalance(balanceData);
        setTransactions(historyData.transactions);
        setContracts(contractData);
        if (contractData.length === 0) setShowOnboarding(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authUser, authLoading]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">Loading Recovery Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="mx-auto text-red-500" size={48} />
          <p className="text-red-400 font-bold">{error}</p>
          <p className="text-neutral-500 text-sm">Ensure the backend service is reachable.</p>
        </div>
      </div>
    );
  }

  const integrityScore = balance?.integrity_score ?? 0;
  const activeStake = contracts
    .filter((c) => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + Number(c.stake_amount), 0);
  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12">
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-16 border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-xl font-black text-black">S</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Recovery Dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Link href="/wallet" className="px-3 md:px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800 text-xs md:text-sm font-bold text-neutral-400 hover:text-white transition-colors">
            WALLET
          </Link>
          <Link href="/settings" className="px-3 md:px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800 text-xs md:text-sm font-bold text-neutral-400 hover:text-white transition-colors flex items-center gap-1">
            <Settings size={14} />
          </Link>
          {authUser?.role === 'ADMIN' && (
            <Link href="/admin" className="px-3 md:px-4 py-2 bg-neutral-900 rounded-full border border-red-900/50 text-xs md:text-sm font-bold text-red-400 hover:text-red-300 transition-colors">
              ADMIN
            </Link>
          )}
          <NotificationPanel />
          <Link href="/profile" className="flex items-center gap-2 px-3 md:px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800 hover:border-neutral-600 transition-colors">
            <User size={16} className="text-neutral-400" />
            <span className="font-bold text-sm hidden sm:inline">{authUser?.email ?? balance?.email ?? 'Unknown'}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 md:px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800 text-xs md:text-sm font-bold text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">LOGOUT</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Left Column: Core Identity */}
        <div className="lg:col-span-1 space-y-8">
          {/* Integrity Score Card */}
          <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <ShieldCheck size={24} className={integrityScore >= 100 ? 'text-green-500' : integrityScore >= 50 ? 'text-yellow-500' : 'text-red-500'} />
            </div>
            <h2 className="text-neutral-500 font-bold tracking-widest text-sm mb-4">INTEGRITY SCORE</h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-black tracking-tighter">{integrityScore}</span>
            </div>
            <p className="text-neutral-400 text-sm">
              {balance?.allowed_tiers?.includes('TIER_2_STANDARD')
                ? 'Standard tier. Up to $100 test stakes.'
                : balance?.allowed_tiers?.includes('TIER_1_MICRO_STAKES')
                ? 'Micro stakes tier. Up to $20 test stakes.'
                : 'Restricted mode. Build integrity to unlock stakes.'}
            </p>
          </div>

          {/* Active Stake Card */}
          <div className="p-8 bg-neutral-900 border border-red-900/50 rounded-3xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
              <Flame size={120} />
            </div>
            <h2 className="text-neutral-500 font-bold tracking-widest text-sm mb-4">CAPITAL AT RISK (TEST CREDITS)</h2>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl text-red-500 font-medium">TEST-$</span>
              <span className="text-5xl font-black text-white">{activeStake.toFixed(2)}</span>
            </div>
            <p className="text-neutral-500 text-sm mb-6">{activeCount} active beta contract{activeCount !== 1 ? 's' : ''}</p>
            <Link href="/contracts/new" className="block w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-colors text-center">
              CREATE NEW CONTRACT
            </Link>
          </div>

          {/* Leaderboard hidden in Phase 1 Beta */}
          {/* <Leaderboard /> */}
        </div>

        {/* Right Column: Ledger & Actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Truth Log Ledger */}
          <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl">
            <div className="flex items-center gap-3 mb-8">
              <History className="text-neutral-500" />
              <h2 className="text-xl font-bold tracking-tighter">TRUTH LOG</h2>
            </div>

            {transactions.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No ledger entries yet. Create a contract to begin.</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => {
                  const type = tx.type || 'TRANSACTION';
                  const amount = tx.amount;
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-black rounded-2xl border border-neutral-800">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                          <Activity size={16} className={amount < 0 ? 'text-red-500' : 'text-green-400'} />
                        </div>
                        <div>
                          <p className="font-bold">{type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-neutral-500">{new Date(tx.timestamp).toLocaleDateString()} &bull; {tx.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black ${amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {amount < 0 ? '-' : '+'}TEST-${Math.abs(amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Contracts */}
          <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Activity className="text-neutral-500" />
                <h2 className="text-xl font-bold tracking-tighter">MY CONTRACTS</h2>
              </div>
              <Link href="/contracts/new" className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors">
                + NEW
              </Link>
            </div>

            {contracts.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">Your recovery journey starts here. Create your first contract.</p>
            ) : (
              <div className="space-y-3">
                {contracts.map((c) => {
                  const status = c.status;
                  const statusColor = status === 'COMPLETED' ? 'text-green-400' : status === 'FAILED' ? 'text-red-400' : status === 'ACTIVE' ? 'text-yellow-400' : 'text-blue-400';
                  const statusBg = status === 'COMPLETED' ? 'bg-green-900/30' : status === 'FAILED' ? 'bg-red-900/30' : status === 'ACTIVE' ? 'bg-yellow-900/30' : 'bg-blue-900/30';
                  return (
                    <Link
                      key={c.id}
                      href={`/contracts/${c.id}`}
                      className="flex items-center justify-between p-4 bg-black rounded-2xl border border-neutral-800 hover:border-neutral-600 transition-colors"
                    >
                      <div>
                        <p className="font-bold">{(c.oath_category || 'CONTRACT').replace(/_/g, ' ')}</p>
                        <p className="text-xs text-neutral-500">
                          {c.id.slice(0, 8)} &bull; {c.ends_at ? new Date(c.ends_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-white">TEST-${Number(c.stake_amount).toFixed(2)}</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusBg} ${statusColor}`}>
                          {status}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
