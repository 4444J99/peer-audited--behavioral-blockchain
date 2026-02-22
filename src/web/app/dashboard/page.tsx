import React from 'react';
import { Activity, ShieldCheck, Flame, Scale, History, User } from 'lucide-react';

export default function IdentityDashboard() {
  // MOCK DATA: Simulating a fetch from the Styx API
  const user = {
    username: '4jp',
    integrityScore: 845,
    status: 'ACTIVE',
    activeStake: 250.00,
    joinDate: 'Jan 2026',
  };

  const ledgerHistory = [
    { id: 'tx_101', date: 'Today', type: 'PROOF_VERIFIED', amount: 0, status: 'SUCCESS' },
    { id: 'tx_100', date: 'Yesterday', type: 'PROOF_VERIFIED', amount: 0, status: 'SUCCESS' },
    { id: 'tx_099', date: 'Feb 19', type: 'HABIT_FAILED', amount: -5.00, status: 'PENALTY' },
    { id: 'tx_098', date: 'Feb 18', type: 'FURY_BOUNTY_WON', amount: +2.50, status: 'REWARD' },
  ];

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
          <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800">
            <User size={16} className="text-neutral-400" />
            <span className="font-bold">{user.username}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Left Column: Core Identity */}
        <div className="lg:col-span-1 space-y-8">
          {/* Integrity Score Card */}
          <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <ShieldCheck size={24} className={user.integrityScore > 800 ? "text-green-500" : "text-yellow-500"} />
            </div>
            <h2 className="text-neutral-500 font-bold tracking-widest text-sm mb-4">INTEGRITY SCORE</h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-black tracking-tighter">{user.integrityScore}</span>
              <span className="text-xl text-neutral-500">/ 1000</span>
            </div>
            <p className="text-neutral-400 text-sm">Top 12% of the network. High trust tier.</p>
          </div>

          {/* Active Stake Card */}
          <div className="p-8 bg-neutral-900 border border-red-900/50 rounded-3xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
              <Flame size={120} />
            </div>
            <h2 className="text-neutral-500 font-bold tracking-widest text-sm mb-4">CAPITAL AT RISK</h2>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl text-red-500 font-medium">$</span>
              <span className="text-5xl font-black text-white">{user.activeStake.toFixed(2)}</span>
            </div>
            <button className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-colors">
              SUBMIT DAILY PROOF
            </button>
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
            
            <div className="space-y-4">
              {ledgerHistory.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-black rounded-2xl border border-neutral-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                      <Activity size={16} className={tx.status === 'SUCCESS' ? 'text-green-400' : tx.status === 'PENALTY' ? 'text-red-500' : 'text-blue-400'} />
                    </div>
                    <div>
                      <p className="font-bold">{tx.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-neutral-500">{tx.date} • {tx.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${tx.amount < 0 ? 'text-red-500' : tx.amount > 0 ? 'text-green-500' : 'text-neutral-400'}`}>
                      {tx.amount === 0 ? '--' : `${tx.amount > 0 ? '+' : ''}$${Math.abs(tx.amount).toFixed(2)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
