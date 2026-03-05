'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white font-sans text-center p-8">
      {/* Hero Section */}
      <div className="w-20 h-20 bg-red-600 rounded-full mb-8 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.4)]">
        <span className="text-3xl font-black text-black">S</span>
      </div>
      <h1 className="text-7xl font-black tracking-tighter mb-6 uppercase text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-600">STYX</h1>
      <p className="text-2xl text-neutral-300 max-w-2xl mb-12 font-medium leading-relaxed">
        The Blockchain of Truth for Relationship Recovery. We weaponize loss aversion to enforce the No Contact rule. Stake your money. Maintain your distance. Earn back your emotional resilience.
      </p>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-6 mb-24">
        <Link
          href={user ? '/dashboard' : '/login'}
          className="px-8 py-4 bg-white text-black font-extrabold rounded-full hover:bg-neutral-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          ENTER THE ARENA
        </Link>
        <Link
          href="/pitch"
          className="px-8 py-4 bg-transparent border border-neutral-700 text-white font-bold rounded-full hover:border-white transition-all"
        >
          VIEW THE MANIFESTO
        </Link>
        <Link
          href="/ask"
          className="px-8 py-4 bg-transparent border border-neutral-700 text-white font-bold rounded-full hover:border-red-600 transition-all"
        >
          ASK STYX AI
        </Link>
      </div>
      
      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full max-w-5xl">
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-colors">
          <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">ZERO TRUST</h3>
          <p className="text-neutral-400 leading-relaxed">Hardware-only oracles. No manual entries. Your biometric data is pulled directly from the silicon. You cannot lie to Styx.</p>
        </div>
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-colors">
          <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">WEAPONIZED WHISTLEBLOWER</h3>
          <p className="text-neutral-400 leading-relaxed">The Ex Bounty. Generate a unique, anonymous link for your ex-partner. If you break No Contact, their proof immediately burns your staked funds.</p>
        </div>
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-colors">
          <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">HARD LEDGER</h3>
          <p className="text-neutral-400 leading-relaxed">ACID-compliant PostgreSQL double-entry bookkeeping. Every penny staked, lost, and refunded is cryptographically securely logged.</p>
        </div>
      </div>
    </div>
  );
}
