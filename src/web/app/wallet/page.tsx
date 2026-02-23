'use client';

import React, { useEffect, useState } from 'react';
import { EscrowConnect } from '../../components/EscrowConnect';
import { Wallet as WalletIcon, Lock, ArrowRightCircle, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../services/api-client';

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID || 'd0000000-0000-0000-0000-000000000001';

interface Contract {
  id: string;
  oath_category: string;
  stake_amount: string;
  status: string;
  ends_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'text-red-500',
  COMPLETED: 'text-green-500',
  FAILED: 'text-orange-500',
  PENDING_STAKE: 'text-yellow-500',
};

export default function WalletDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getUserContracts(DEMO_USER_ID);
        setContracts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contracts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <header className="flex justify-between items-center mb-12 border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-lime-500 rounded-full flex items-center justify-center">
            <WalletIcon className="text-black" />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Capital Escrow</h1>
        </div>
        <Link href="/dashboard" className="text-sm font-bold text-neutral-400 hover:text-white transition-colors">
          RETURN TO IDENTITY &rarr;
        </Link>
      </header>

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
    </div>
  );
}
