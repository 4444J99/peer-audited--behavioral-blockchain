'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Award, Eye, HeartHandshake, ArrowRight, BookOpen, MessageCircle } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center min-h-screen bg-neutral-950 text-white font-sans">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-[90vh] text-center p-8 w-full bg-gradient-to-b from-neutral-950 via-neutral-950 to-black">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="w-20 h-20 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.4)]">
            <span className="text-3xl font-black text-black">S</span>
          </div>

      {/* Primary Action — single public CTA into the beta waitlist */}
      <div className="flex flex-col sm:flex-row gap-6 mb-24">
        <Link
          href={user ? '/dashboard' : '/beta'}
          className="px-8 py-4 bg-white text-black font-extrabold rounded-full hover:bg-neutral-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          {user ? 'GO TO DASHBOARD' : 'JOIN THE PRIVATE BETA'}
        </Link>
      </div>
      
      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full max-w-5xl">
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-colors">
          <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">DAILY CHECK-INS</h3>
          <p className="text-neutral-400 leading-relaxed">A focused iOS beta for no-contact recovery, built around daily attestations and a simple accountability rhythm.</p>
        </div>
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-colors">
          <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">TEST-MONEY STAKES</h3>
          <p className="text-neutral-400 leading-relaxed">Small financial commitments via Stripe test mode. Loss aversion makes your commitment real without risking actual funds.</p>
        </div>
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-colors">
          <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">PEER AUDIT</h3>
          <p className="text-neutral-400 leading-relaxed">Anonymous verification by trained peers. No bias, no exceptions — just evidence-based accountability.</p>
        </div>
      </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="w-full py-12 px-8 border-t border-neutral-800">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, text: 'FBO Escrow Account', sub: 'Funds segregated via Stripe' },
            { icon: Eye, text: 'Peer-Audited', sub: 'Anonymous Fury verification' },
            { icon: Award, text: 'Loss Aversion', sub: '1.955x psychological leverage' },
            { icon: HeartHandshake, text: 'Safety First', sub: 'Aegis health override protocol' },
          ].map((badge, i) => (
            <div key={i} className="flex flex-col items-center text-center p-4">
              <badge.icon size={24} className="text-red-500 mb-2" />
              <span className="font-bold text-sm text-neutral-200">{badge.text}</span>
              <span className="text-xs text-neutral-500 mt-1">{badge.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="w-full py-16 px-8 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center mb-12 uppercase">
          The{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300">STYX Method</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Commit with Stakes',
              desc: 'Define a specific behavioral contract and put test-money on the line. Loss aversion makes quitting genuinely costly — follow-through rates dramatically outperform habit trackers.',
            },
            {
              title: 'Anonymous Peer Audit',
              desc: 'A Fury reviews your proof without knowing who you are. No bias, no exceptions. The verdict is based purely on evidence.',
            },
            {
              title: 'Double-Entry Ledger',
              desc: 'Every transaction and verdict is recorded in a cryptographically traceable ledger. No retroactive edits, no ambiguous outcomes.',
            },
          ].map((feature, i) => (
            <div key={i} className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-all">
              <h3 className="text-red-500 font-black text-xl mb-3 tracking-wide">{feature.title}</h3>
              <p className="text-neutral-400 leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contract Categories */}
      <section className="w-full py-16 px-8 max-w-5xl mx-auto border-t border-neutral-800">
        <h2 className="text-2xl font-black tracking-tight text-center mb-8 uppercase">Commitment Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Recovery', 'Biological', 'Cognitive', 'Professional', 'Creative', 'Environmental', 'Character', 'Social'].map((cat) => (
            <div key={cat} className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-center text-sm font-bold text-neutral-300 hover:border-red-600/50 hover:text-white transition-all">
              {cat}
            </div>
          ))}
        </div>
      </section>

      {/* Science Note */}
      <section className="w-full py-16 px-8 bg-neutral-950 border-t border-neutral-800">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-black tracking-tight uppercase">Built on Behavioral Science</h2>
          <p className="text-neutral-400 leading-relaxed">
            Styx applies prospect theory (Kahneman & Tversky, 1979), implementation intentions (Gollwitzer, 1999),
            and peer-verified accountability — combining three of the most robust findings in behavioral economics
            into a single platform. The result is accountability that actually works, not a to-do list you ignore after two weeks.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-20 px-8 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-black tracking-tight uppercase">Reclaim Your Resilience</h2>
          <p className="text-neutral-400 text-lg">
            Join the private beta. Test-money only. No real funds at risk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={user ? '/dashboard' : '/register'}
              className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-extrabold rounded-full hover:bg-red-700 hover:scale-105 transition-all"
            >
              {user ? 'DASHBOARD' : 'START RECOVERY'}
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 border border-neutral-700 text-white font-bold rounded-full hover:bg-neutral-800 transition-all"
            >
              <MessageCircle size={18} />
              FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
