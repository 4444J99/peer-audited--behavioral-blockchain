'use client';

import React, { useEffect, useState } from 'react';
import { EscrowConnect } from '../../components/EscrowConnect';
import { Wallet as WalletIcon, Lock, ArrowRightCircle, Loader2, AlertTriangle, LogOut, History } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api-client';
import { useAuth } from '../../contexts/AuthContext';

interface Contract {
  id: string;
  oath_category: string;
  stake_amount: string;
  status: string;
  ends_at: string;
}

interface Balance {
  userId: string;
  email: string;
  integrityScore: number;
  allowedTiers: string[];
  ledgerBalance: number;
  status: string;
}

interface Transaction {
  id: string;
  debit_account_id: string;
  credit_account_id: string;
  amount: string;
  contract_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  debit_account_name: string;
  credit_account_name: string;
}

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  FURY_BOUNTY: { label: 'Fury Bounty Earned', color: 'text-lime-400' },
  FURY_PENALTY: { label: 'Fury Penalty', color: 'text-red-500' },
  STAKE_HOLD: { label: 'Stake Held', color: 'text-yellow-500' },
  STAKE_RELEASE: { label: 'Stake Released', color: 'text-green-400' },
  STAKE_BURN: { label: 'Stake Burned', color: 'text-red-500' },
  ONBOARDING_BONUS: { label: 'Onboarding Bonus', color: 'text-lime-400' },
  APPEAL_FEE: { label: 'Appeal Fee', color: 'text-orange-400' },
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'text-red-500',
  COMPLETED: 'text-green-500',
  FAILED: 'text-orange-500',
  PENDING_STAKE: 'text-yellow-500',
};

function getTxLabel(metadata: Record<string, unknown>): { label: string; color: string } {
  const type = (metadata?.type as string) || '';
  return TX_TYPE_LABELS[type] || { label: type || 'Transaction', color: 'text-neutral-400' };
}

export default function WalletDashboard() {
  const { user: authUser, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !authUser) return;
    async function load() {
      try {
        const [contractsData, balanceData, historyData] = await Promise.all([
          api.getUserContracts(),
          api.getBalance().catch(() => null),
          api.getHistory(20).catch(() => ({ transactions: [] })),
        ]);
        setContracts(contractsData);
        setBalance(balanceData);
        setTransactions(historyData.transactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contracts');
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

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12 border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-lime-500 rounded-full flex items-center justify-center">
            <WalletIcon className="text-black" />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Capital Escrow</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-bold text-neutral-400 hover:text-white transition-colors">
            RETURN TO IDENTITY &rarr;
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800 text-sm font-bold text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Balance Summary */}
      {balance && (
        <div className="max-w-5xl mx-auto mb-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Ledger Balance</p>
            <p className="font-black text-2xl text-lime-400">${balance.ledgerBalance.toFixed(2)}</p>
          </div>
          <div className="px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Integrity Score</p>
            <p className="font-black text-2xl text-white">{balance.integrityScore}</p>
          </div>
          <div className="px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Tiers Allowed</p>
            <p className="font-bold text-sm text-neutral-300 mt-1">{balance.allowedTiers.join(', ')}</p>
          </div>
          <div className="px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Account Status</p>
            <p className={`font-black text-lg ${balance.status === 'ACTIVE' ? 'text-lime-400' : 'text-red-500'}`}>{balance.status}</p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Connection Flow */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-black mb-4 tracking-tighter">Your Financial Identity</h2>
            <p className="text-neutral-400 mb-8 leading-relaxed">
              Styx operates on actual loss aversion. You must pledge real capital. When you commit to a behavioral contract, your funds are placed in a hard cryptographic hold. Fulfill the contract, your funds resolve. Break the contract, it is burned and redistributed to the Fury.
            </p>
          </div>

          <EscrowConnect />
        </div>

        {/* Stake Configuration */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Lock size={120} />
          </div>

          <h3 className="text-lime-500 font-bold mb-8">Active Escrow Contracts</h3>

          <div className="space-y-6 relative z-10">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin mr-3 text-neutral-500" size={24} />
                <span className="text-neutral-500 font-bold">Loading contracts...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto text-red-500 mb-3" size={32} />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : contracts.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No contracts yet. Create one to begin.</p>
            ) : (
              contracts.map((contract) => (
                <div key={contract.id} className="p-4 bg-black border border-neutral-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-black text-lg">{contract.oath_category.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-neutral-500">
                      {contract.ends_at
                        ? `Expires: ${new Date(contract.ends_at).toLocaleDateString()}`
                        : 'No expiry set'}
                    </p>
                    <p className={`text-xs font-bold mt-1 ${STATUS_COLORS[contract.status] ?? 'text-neutral-400'}`}>
                      {contract.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-neutral-400">Pledged</p>
                    <p className="font-black text-2xl text-red-500">${Number(contract.stake_amount).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}

            <Link href="/contracts/new" className="w-full mt-4 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2">
              <ArrowRightCircle />
              AUTHORIZE NEW DEPOSIT
            </Link>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div className="max-w-5xl mx-auto mt-12">
          <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
            <History size={18} className="text-neutral-500" /> Transaction History
          </h3>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl divide-y divide-neutral-800">
            {transactions.map((tx) => {
              const { label, color } = getTxLabel(tx.metadata);
              return (
                <div key={tx.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className={`font-bold text-sm ${color}`}>{label}</p>
                    <p className="text-xs text-neutral-600 mt-1">
                      {tx.debit_account_name} &rarr; {tx.credit_account_name}
                      {tx.contract_id && <span className="ml-2 text-neutral-700">Contract: {tx.contract_id.slice(0, 8)}...</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white">${Number(tx.amount).toFixed(2)}</p>
                    <p className="text-xs text-neutral-600">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
