'use client';

import Link from 'next/link';

export default function NoContactGuide() {
  return (
    <div className="min-h-screen bg-black text-white font-sans p-8 md:p-16">
      <article className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <span className="text-red-500 text-sm font-bold uppercase tracking-widest">Recovery Guide</span>
          <h1 className="text-4xl font-black tracking-tight">How to Survive No-Contact: The Complete Guide</h1>
          <p className="text-neutral-400 text-lg">Breaking up is hard. Staying no-contact is harder. Here is how to make it stick.</p>
          <div className="flex items-center gap-4 text-sm text-neutral-500 border-b border-neutral-800 pb-6">
            <span>8 min read</span>
            <span>Updated July 2026</span>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Why No-Contact Works</h2>
          <p className="text-neutral-300 leading-relaxed">
            No-contact is the single most effective strategy for post-breakup recovery. Research in behavioral psychology shows that
            removing the stimulus of an ex-partner reduces craving activation in the brain's reward centers — the same neural
            pathways involved in substance withdrawal. Every time you break no-contact, you reset the clock on your recovery.
          </p>
          <p className="text-neutral-300 leading-relaxed">
            The average person attempts no-contact 7 times before it sticks. The problem isn't willpower — it's that willpower alone
            isn't designed to compete with emotional triggers. That is where accountability tools come in.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Phase 1: The First 48 Hours</h2>
          <p className="text-neutral-300 leading-relaxed">
            The first 48 hours are the hardest. Your brain is in withdrawal mode, rationalizing every excuse to reach out. Here is
            how to get through it:
          </p>
          <ul className="space-y-3 text-neutral-300">
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Remove temptation:</strong> Block or mute their number, social media, and email. Out of sight literally reduces craving activation in fMRI studies.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Tell someone:</strong> Accountability doubles follow-through. Tell a friend, therapist, or use a commitment app.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Create friction:</strong> Make it hard to break no-contact. Delete their contact info. Give a friend your phone overnight.</span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Phase 2: Building the Habit</h2>
          <p className="text-neutral-300 leading-relaxed">
            Days 3-14 are about replacing the old habit with new ones. Every time you resist the urge to reach out, you weaken
            the neural pathway of that behavior and strengthen self-regulation.
          </p>
          <ul className="space-y-3 text-neutral-300">
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Daily check-ins:</strong> Make a daily habit of affirming your commitment. Morning and evening.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Urge surfing:</strong> When the urge hits, set a timer for 10 minutes. Urges peak at 3-5 minutes and fade. Do not act in the peak.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Redirection:</strong> Have a go-to activity ready — call a friend, go for a run, open a book. The goal is to redirect, not resist.</span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Phase 3: Long-Term Maintenance</h2>
          <p className="text-neutral-300 leading-relaxed">
            After 30 days, the acute cravings fade. The challenge shifts to long-term maintenance — not letting complacency undo
            your progress. This is where accountability systems outperform willpower alone.
          </p>
          <p className="text-neutral-300 leading-relaxed">
            Research on loss aversion (Kahneman & Tversky, 1979) shows that the pain of losing something is roughly twice as
            powerful as the pleasure of gaining it. Staking money on your no-contact commitment harnesses this asymmetry — making
            the cost of breaking no-contact immediate and real, not abstract.
          </p>
        </section>

        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-lg">Make It Stick with Styx</h3>
          <p className="text-neutral-400 text-sm">
            Styx turns no-contact recovery into a binding commitment. You define your terms, stake test money, and submit
            daily proof. A peer auditor verifies your compliance. Succeed and your stake returns. Break no-contact and you lose it.
          </p>
          <Link
            href="/register?source=no-contact-guide"
            className="inline-block px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-all"
          >
            Start Your Contract
          </Link>
        </div>
      </article>
    </div>
  );
}
