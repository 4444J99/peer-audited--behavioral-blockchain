import React from 'react';
import { EscrowConnect } from '../../components/EscrowConnect';
import { Wallet as WalletIcon, Lock, ArrowRightCircle } from 'lucide-react';
import Link from 'next/link';

export default function WalletDashboard() {
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
            {/* Contract 1 */}
            <div className="p-4 bg-black border border-neutral-800 rounded-2xl flex justify-between items-center">
              <div>
                <p className="font-black text-lg">Daily Marathon (10k Steps)</p>
                <p className="text-sm text-neutral-500">Expires: Today at 11:59PM</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-neutral-400">Pledged</p>
                <p className="font-black text-2xl text-red-500">$50.00</p>
              </div>
            </div>

            {/* Contract 2 */}
            <div className="p-4 bg-black border border-neutral-800 rounded-2xl flex justify-between items-center">
              <div>
                <p className="font-black text-lg">Sober October (Zero BAC)</p>
                <p className="text-sm text-neutral-500">Expires: Oct 31 at 11:59PM</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-neutral-400">Pledged</p>
                <p className="font-black text-2xl text-red-500">$500.00</p>
              </div>
            </div>

            <button className="w-full mt-4 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2">
              <ArrowRightCircle />
              AUTHORIZE NEW DEPOSIT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
