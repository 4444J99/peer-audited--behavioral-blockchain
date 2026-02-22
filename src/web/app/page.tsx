import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white font-sans text-center p-8">
      {/* Hero Section */}
      <div className="w-20 h-20 bg-red-600 rounded-full mb-8 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.4)]">
        <span className="text-3xl font-black text-black">S</span>
      </div>
      <h1 className="text-7xl font-black tracking-tighter mb-6 uppercase text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-600">STYX</h1>
      <p className="text-2xl text-neutral-300 max-w-2xl mb-12 font-medium leading-relaxed">
        The Blockchain of Truth. We weaponize loss aversion to forge unbreakable habits. Stake your money. Prove your actions. Earn back your integrity.
      </p>
      
      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-6 mb-24">
        <Link 
          href="/dashboard"
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
      </div>
      
      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full max-w-5xl">
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-colors">
          <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">ZERO TRUST</h3>
          <p className="text-neutral-400 leading-relaxed">Hardware-only oracles. No manual entries. Your biometric data is pulled directly from the silicon. You cannot lie to Styx.</p>
        </div>
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-colors">
          <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">PEER AUDITED</h3>
          <p className="text-neutral-400 leading-relaxed">The Fury Bounty. A decentralized network of your peers audits your daily video proofs. A false claim means immediate financial execution.</p>
        </div>
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-colors">
          <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">HARD LEDGER</h3>
          <p className="text-neutral-400 leading-relaxed">ACID-compliant PostgreSQL double-entry bookkeeping. Every penny staked, lost, and refunded is cryptographically securely logged.</p>
        </div>
      </div>
    </div>
  );
}
