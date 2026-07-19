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
        Private beta for no-contact recovery. Daily accountability, test-money commitments, and a small US allowlist help you keep the boundary intact without pretending this phase is more than it is.
      </p>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-6 mb-24">
        <Link
          href={user ? '/dashboard' : '/login'}
          className="px-8 py-4 bg-white text-black font-extrabold rounded-full hover:bg-neutral-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          START RECOVERY
        </Link>
      </div>
      
      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full max-w-5xl">
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-colors">
          <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">DAILY CHECK-INS</h3>
          <p className="text-neutral-400 leading-relaxed">A focused iOS beta for no-contact recovery, built around daily attestations and a simple accountability rhythm.</p>
        </div>
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-colors">
          <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">ACCOUNTABILITY PARTNER</h3>
          <p className="text-neutral-400 leading-relaxed">Invite one trusted person into the loop so the recovery boundary is reinforced by real accountability, not just good intentions.</p>
        </div>
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-colors">
          <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">TEST-MONEY PILOT</h3>
          <p className="text-neutral-400 leading-relaxed">Phase 1 uses test-money only. No real funds move in this beta, and access is limited to a small US allowlist while the core path is hardened.</p>
        </div>
      </div>
    </div>
  );
}
