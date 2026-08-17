'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle, BookOpen, AlertTriangle, Shield, HelpCircle, ExternalLink, ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'What is Styx?',
    a: 'Styx is a peer-audited behavioral accountability platform. You create a behavioral contract (an "Oath"), stake money on it, submit proof of compliance, and a peer auditor verifies whether you followed through. Success means your stake returns. Failure means you lose it.',
  },
  {
    q: 'How do I create my first contract?',
    a: 'Sign up, choose an Oath category (Recovery, Biological, Cognitive, etc.), define your commitment in specific verifiable terms, stake your money, and submit proof at the intervals your contract requires. A Fury reviews your proof and issues a verdict.',
  },
  {
    q: 'What\'s a Fury?',
    a: 'A Fury is a peer auditor who reviews your proof submissions and determines whether you\'ve met your contract terms. They\'re real people — not algorithms — so your accountability is verified by human judgment.',
  },
  {
    q: 'How much does it cost?',
    a: 'You choose your stake, and during the beta there is no platform fee — the amount you commit is the amount held in escrow. On success it is returned in full; on failure it is forfeited. Your maximum stake depends on your Integrity Score tier.',
  },
  {
    q: 'Is my money safe?',
    a: 'Yes. All stakes are held in a Stripe FBO escrow account — segregated from Styx operating funds. A double-entry integrity ledger tracks every transaction.',
  },
  {
    q: 'What if the Fury makes a wrong decision?',
    a: 'You have 48 hours after a verdict to file an appeal, at no cost. A human Judge reviews the original evidence and the Fury votes. If the Judge overturns the verdict, your stake is returned. Judge decisions are final.',
  },
  {
    q: 'How does no-contact tracking work?',
    a: 'Recovery Oaths use proof of compliance rather than surveillance. You submit periodic proof that you\'ve maintained no-contact, such as a screenshot showing no recent calls/texts or a check-in statement. Your Fury evaluates edge cases.',
  },
  {
    q: 'What\'s the Aegis protocol?',
    a: 'Aegis is Styx\'s health and safety guardrail system. It activates when contracts involve potentially dangerous behavior, proof submissions indicate distress, or a Fury flags a safety concern. Aegis can pause or terminate a contract with a full refund.',
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight uppercase">Help & FAQ</h1>
          <p className="text-neutral-400 text-lg">Everything you need to know about using Styx.</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/ask"
            className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-all group"
          >
            <MessageCircle size={24} className="text-red-500 mb-3" />
            <h3 className="font-bold mb-1 group-hover:text-red-400 transition-colors">Ask Styx AI</h3>
            <p className="text-sm text-neutral-500">Get instant answers from our AI assistant.</p>
          </Link>
          <Link
            href="/legal/terms"
            className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-all group"
          >
            <BookOpen size={24} className="text-red-500 mb-3" />
            <h3 className="font-bold mb-1 group-hover:text-red-400 transition-colors">Terms of Service</h3>
            <p className="text-sm text-neutral-500">Platform rules, rights, and obligations.</p>
          </Link>
          <Link
            href="/legal/responsible-use"
            className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-red-600/50 transition-all group"
          >
            <Shield size={24} className="text-red-500 mb-3" />
            <h3 className="font-bold mb-1 group-hover:text-red-400 transition-colors">Safety Resources</h3>
            <p className="text-sm text-neutral-500">Crisis lines, healthy use guidelines.</p>
          </Link>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <HelpCircle size={20} className="text-red-500" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold hover:bg-neutral-800/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-neutral-500 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openIndex === i && (
                  <div className="px-5 pb-5 text-neutral-400 leading-relaxed border-t border-neutral-800 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="p-8 bg-neutral-900 border border-amber-800/30 rounded-2xl">
          <div className="flex items-start gap-4">
            <AlertTriangle size={20} className="text-amber-500 mt-1 shrink-0" />
            <div className="space-y-2">
              <h3 className="font-bold text-amber-400">Still need help?</h3>
              <p className="text-neutral-400 text-sm">
                For support requests, contact us at{' '}
                <a href="mailto:safety@styx.protocol" className="text-red-500 hover:text-red-400 underline">safety@styx.protocol</a>.
                {' '}In an emergency, visit our{' '}
                <Link href="/legal/responsible-use" className="text-red-500 hover:text-red-400 underline">Safety Resources page</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
