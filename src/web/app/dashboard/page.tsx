'use client';

import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Flame, History, User, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../services/api-client';

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID || 'd0000000-0000-0000-0000-000000000001';

interface BalanceData {
  userId: string;
  email: string;
  integrityScore: number;
  allowedTiers: string[];
  ledgerBalance: number;
  status: string;
}

interface Transaction {
  id: string;
  amount: string;
  metadata: Record<string, unknown>;
  created_at: string;
  debit_account_name: string;
  credit_account_name: string;
}

interface Contract {
  id: string;
  stake_amount: string;
  status: string;
}

export default function IdentityDashboard() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [balanceData, historyData, contractData] = await Promise.all([
          api.getBalance(DEMO_USER_ID),
          api.getHistory(DEMO_USER_ID, 10),
          api.getUserContracts(DEMO_USER_ID),
        ]);
        setBalance(balanceData);
        setTransactions(historyData.transactions);
        setContracts(contractData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">Loading Identity Oracle...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="mx-auto text-red-500" size={48} />
          <p className="text-red-400 font-bold">{error}</p>
          <p className="text-neutral-500 text-sm">Ensure the API is running on port 3000.</p>
        </div>
      </div>
    );
  }

  const integrityScore = balance?.integrityScore ?? 0;
  const activeStake = contracts
    .filter((c) => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + Number(c.stake_amount), 0);
  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12">
      <header className="flex justify-between items-center mb-16 border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-xl font-black text-black">S</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Identity Oracle</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/fury" className="px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800 text-sm font-bold text-neutral-400 hover:text-white transition-colors">
            FURY WORKBENCH
          </Link>
          <Link href="/wallet" className="px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800 text-sm font-bold text-neutral-400 hover:text-white transition-colors">
            WALLET
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800">
            <User size={16} className="text-neutral-400" />
            <span className="font-bold">{balance?.email ?? 'Unknown'}</span>
          </div>
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
              {balance?.allowedTiers?.includes('TIER_4_WHALE_VAULTS')
                ? 'Whale tier. Maximum trust.'
                : balance?.allowedTiers?.includes('TIER_3_HIGH_ROLLER')
                ? 'High roller tier. Up to $1000 stakes.'
                : balance?.allowedTiers?.includes('TIER_2_STANDARD')
                ? 'Standard tier. Up to $100 stakes.'
                : balance?.allowedTiers?.includes('TIER_1_MICRO_STAKES')
                ? 'Micro stakes tier. Up to $20 stakes.'
                : 'Restricted mode. Build integrity to unlock stakes.'}
            </p>
          </div>

          {/* Active Stake Card */}
          <div className="p-8 bg-neutral-900 border border-red-900/50 rounded-3xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
              <Flame size={120} />
            </div>
            <h2 className="text-neutral-500 font-bold tracking-widest text-sm mb-4">CAPITAL AT RISK</h2>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl text-red-500 font-medium">$</span>
              <span className="text-5xl font-black text-white">{activeStake.toFixed(2)}</span>
            </div>
            <p className="text-neutral-500 text-sm mb-6">{activeCount} active contract{activeCount !== 1 ? 's' : ''}</p>
            <Link href="/contracts/new" className="block w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-colors text-center">
              CREATE NEW CONTRACT
            </Link>
          </div>
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
                  const type = (tx.metadata as Record<string, string>)?.type ?? 'TRANSACTION';
                  const amount = Number(tx.amount);
                  const isDebit = tx.debit_account_name && !tx.debit_account_name.startsWith('SYSTEM');
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-black rounded-2xl border border-neutral-800">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                          <Activity size={16} className={isDebit ? 'text-red-500' : 'text-green-400'} />
                        </div>
                        <div>
                          <p className="font-bold">{type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-neutral-500">{new Date(tx.created_at).toLocaleDateString()} &bull; {tx.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black ${isDebit ? 'text-red-500' : 'text-green-500'}`}>
                          {isDebit ? '-' : '+'}${amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
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
