'use client';

import Link from 'next/link';
import { Shield, Users, Scale, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react';

const steps = [
  {
    title: 'Commit',
    desc: 'Define your Oath — a specific, verifiable behavioral commitment. Choose from Recovery, Biological, Cognitive, and more. Stake test money to make it real.',
  },
  {
    title: 'Submit Proof',
    desc: 'Upload daily check-in proof — text affirmations, screenshots, or photos. Your schedule is set by your contract terms.',
  },
  {
    title: 'Fury Verifies',
    desc: 'A peer auditor (Fury) reviews your proof anonymously. They don\'t know who you are — they judge only the evidence.',
  },
  {
    title: 'Succeed or Learn',
    desc: 'Follow through and your stake returns. Stumble and you lose it, with a portion going to the Fury who caught it. Loss aversion makes quitting genuinely costly.',
  },
];

const trustItems = [
  'Test-money only — no real funds at risk during beta',
  'Stripe FBO escrow — your stake is segregated from operating funds',
  'Anonymous peer audit — Furies never see your identity',
  'Double-entry ledger — every transaction is cryptographically traceable',
  'Aegis safety protocol — health and safety override all contract mechanics',
];

export default function BetaExplainerPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Hero */}
      <section className="p-8 md:p-16 text-center border-b border-neutral-800">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="inline-block px-4 py-1.5 bg-amber-950/60 border border-amber-800/30 text-amber-400 text-xs font-bold uppercase tracking-widest rounded-full">
            Private Beta — Test-Money Pilot
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight uppercase">
            The{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300">STYX Method</span>
          </h1>
          <p className="text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            Behavioral accountability through financial commitment, peer verification, and the proven science of loss aversion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/register?source=beta"
              className="px-8 py-4 bg-white text-black font-extrabold rounded-full hover:bg-neutral-200 hover:scale-105 transition-all"
            >
              JOIN THE PRIVATE BETA
            </Link>
            <Link
              href="/ask"
              className="px-8 py-4 bg-neutral-900 border border-neutral-700 text-white font-bold rounded-full hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              ASK STYX AI
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="p-8 md:p-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black tracking-tight text-center mb-12 uppercase">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div key={i} className="relative p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
              <div className="w-10 h-10 bg-red-600/20 border border-red-600/40 rounded-full flex items-center justify-center mb-4">
                <span className="text-red-500 font-black">{i + 1}</span>
              </div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="p-8 md:p-16 bg-neutral-950 border-y border-neutral-800">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl font-black tracking-tight text-center uppercase">Built on Trust</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
                <span className="text-neutral-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="p-8 md:p-16 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-black tracking-tight uppercase">Ready to Reclaim Your Resilience?</h2>
          <p className="text-neutral-400 text-lg">
            Join the private beta. Test-money only. No real funds at risk.
          </p>
          <Link
            href="/register?source=beta-cta"
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-extrabold rounded-full hover:bg-red-700 hover:scale-105 transition-all"
          >
            JOIN THE BETA
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
