'use client';

import Link from 'next/link';

export default function CouplesRecoveryGuide() {
  return (
    <div className="min-h-screen bg-black text-white font-sans p-8 md:p-16">
      <article className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <span className="text-red-500 text-sm font-bold uppercase tracking-widest">Relationship Recovery</span>
          <h1 className="text-4xl font-black tracking-tight">Recovery Tools for Couples Navigating No-Contact and Breakup Recovery</h1>
          <p className="text-neutral-400 text-lg">Whether you are in no-contact after a breakup or rebuilding a relationship, the right tools make the difference between relapse and lasting change.</p>
          <div className="flex items-center gap-4 text-sm text-neutral-500 border-b border-neutral-800 pb-6">
            <span>6 min read</span>
            <span>Updated July 2026</span>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">The Recovery Gap</h2>
          <p className="text-neutral-300 leading-relaxed">
            Most breakup recovery advice focuses on emotional healing — therapy, self-care, time. These are essential, but they
            miss a critical component: behavioral change. Recovery is not just how you feel; it is what you do. And what you
            do is shaped by your environment, your habits, and your accountability structure.
          </p>
          <p className="text-neutral-300 leading-relaxed">
            The gap between knowing what is good for you and actually doing it is where most recovery efforts fail. This is
            where structured accountability tools bridge the divide.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Tool 1: Structured Accountability</h2>
          <p className="text-neutral-300 leading-relaxed">
            The most effective recovery tool is a structured accountability system. This means:
          </p>
          <ul className="space-y-3 text-neutral-300">
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Defined terms:</strong> Specific, measurable commitments with clear timelines.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Regular check-ins:</strong> Daily or weekly proof of compliance that cannot be faked.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Consequences:</strong> Real stakes that make failure costly and success meaningful.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Objective verification:</strong> A neutral third party who judges compliance without bias.</span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Tool 2: Pre-Commitment Strategies</h2>
          <p className="text-neutral-300 leading-relaxed">
            Pre-commitment means making the desired behavior the path of least resistance while making the undesired behavior
            costly. Examples include:
          </p>
          <ul className="space-y-3 text-neutral-300">
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Financial stakes:</strong> Putting money on the line that you lose if you break no-contact.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Environmental design:</strong> Removing triggers (blocking numbers, deleting social media apps) so the default action supports your commitment.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Social commitment:</strong> Telling friends or a support network about your commitment — creating social cost for failure.</span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Tool 3: Tracking and Measurement</h2>
          <p className="text-neutral-300 leading-relaxed">
            What gets measured gets managed. Tracking your recovery progress gives you objective data about your patterns:
          </p>
          <ul className="space-y-3 text-neutral-300">
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Streak tracking:</strong> Visualizing your consecutive days of compliance reinforces progress and makes you think twice before breaking the chain.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Integrity scoring:</strong> A numeric measure of your reliability over time helps you see the big picture beyond individual days.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Pattern analysis:</strong> Knowing your weak days (e.g., Friday nights or after stressful meetings) lets you prepare defenses in advance.</span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">When to Seek Professional Help</h2>
          <p className="text-neutral-300 leading-relaxed">
            Accountability tools are powerful, but they are not a substitute for professional support. If you are experiencing
            thoughts of self-harm, suicidal ideation, or severe depression, reach out to a crisis resource immediately:
          </p>
          <ul className="space-y-2 text-neutral-300">
            <li>988 Suicide and Crisis Lifeline (call or text 988)</li>
            <li>Crisis Text Line (text HOME to 741741)</li>
            <li>SAMHSA National Helpline (1-800-662-4357)</li>
          </ul>
          <p className="text-neutral-400 text-sm mt-4">
            Styx's Aegis protocol also includes safety overrides — if a Fury or the system detects signs of distress,
            contracts can be paused and crisis resources provided automatically.
          </p>
        </section>

        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-lg">Build Your Recovery System with Styx</h3>
          <p className="text-neutral-400 text-sm">
            Combine financial stakes, anonymous peer verification, and streak tracking into a single accountability system.
            The private beta is open now — test-money only, no real funds at risk.
          </p>
          <Link
            href="/register?source=couples-recovery"
            className="inline-block px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-all"
          >
            Join the Beta
          </Link>
        </div>
      </article>
    </div>
  );
}
