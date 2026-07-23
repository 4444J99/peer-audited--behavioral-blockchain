'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { buildSignupBody, collectAttribution } from '../../utils/waitlist';

type Status = 'idle' | 'submitting' | 'joined' | 'error';

function BetaWaitlistForm() {
  const searchParams = useSearchParams();
  const attribution = useMemo(
    () => collectAttribution(searchParams),
    [searchParams],
  );

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('no-contact');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Enter the email where we should send your invite.');
      return;
    }

    setStatus('submitting');
    try {
      const referrer =
        typeof document !== 'undefined' ? document.referrer : undefined;
      const body = buildSignupBody({ email, name, goal }, attribution, referrer);
      const res = await fetch('/api/beta-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`Signup failed (${res.status})`);
      }
      setStatus('joined');
    } catch {
      setStatus('error');
      setError('Something went wrong. Please try again in a moment.');
    }
  };

  if (status === 'joined') {
    return (
      <div className="border border-neutral-800 bg-neutral-900/80 p-8 text-center">
        <CheckCircle2
          className="mx-auto mb-5 h-12 w-12 text-red-500"
          aria-hidden="true"
        />
        <h2 className="text-2xl font-black text-white">You are on the list</h2>
        <p className="mt-4 text-base leading-7 text-neutral-300">
          Check your inbox for a confirmation link. We admit the iOS private beta
          in small US-only cohorts, so it may take a little time before your spot
          opens. Nothing you do here moves real money.
        </p>
        <Link
          href="/do-not-text-your-ex-tonight"
          className="mt-7 inline-flex items-center justify-center gap-2 border border-neutral-700 px-5 py-3 text-sm font-black uppercase tracking-normal text-neutral-200 transition-colors hover:border-red-500 hover:text-white"
        >
          Use the ten-minute reset tool now
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-neutral-800 bg-neutral-900/80 p-6 sm:p-8"
    >
      <h2 className="text-2xl font-black text-white">Join the Private Beta</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-500">
        One step. Test-money only, iOS only, US allowlist only while we harden the
        core path.
      </p>

      {error && (
        <div className="mt-5 border border-red-800 bg-red-900/30 px-4 py-3 text-sm font-medium text-red-300">
          {error}
        </div>
      )}

      <label
        htmlFor="email"
        className="mt-6 block text-sm font-bold uppercase tracking-widest text-neutral-400"
      >
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="mt-2 w-full border border-neutral-800 bg-black px-4 py-3 text-white placeholder-neutral-600 outline-none transition-colors focus:border-red-600"
        placeholder="you@example.com"
      />

      <label
        htmlFor="name"
        className="mt-5 block text-sm font-bold uppercase tracking-widest text-neutral-400"
      >
        First name <span className="text-neutral-600">(optional)</span>
      </label>
      <input
        id="name"
        type="text"
        autoComplete="given-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="mt-2 w-full border border-neutral-800 bg-black px-4 py-3 text-white placeholder-neutral-600 outline-none transition-colors focus:border-red-600"
        placeholder="What should we call you?"
      />

      <label
        htmlFor="goal"
        className="mt-5 block text-sm font-bold uppercase tracking-widest text-neutral-400"
      >
        What are you working on?
      </label>
      <select
        id="goal"
        value={goal}
        onChange={(event) => setGoal(event.target.value)}
        className="mt-2 w-full border border-neutral-800 bg-black px-4 py-3 text-white outline-none transition-colors focus:border-red-600 [color-scheme:dark]"
      >
        <option value="no-contact">Holding a no-contact boundary</option>
        <option value="post-breakup">Getting through a breakup</option>
        <option value="reduce-contact">Reducing contact gradually</option>
        <option value="support-someone">Supporting someone else</option>
      </select>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-white px-5 py-4 text-sm font-black uppercase tracking-normal text-black transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-700"
      >
        {status === 'submitting' ? 'Joining…' : 'Join the Private Beta'}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-neutral-600">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        No real money. No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}

export default function BetaWaitlistPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:py-20">
        {/* Hero + problem + how-it-works */}
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 shadow-[0_0_32px_rgba(220,38,38,0.36)]">
              <span className="text-xl font-black text-black">S</span>
            </div>
            <span className="text-sm font-black uppercase tracking-[0.28em] text-neutral-300">
              Styx
            </span>
          </div>

          <h1 className="text-5xl font-black uppercase leading-[0.94] tracking-tight sm:text-6xl">
            Keep the boundary you already chose.
          </h1>
          <p className="mt-6 text-xl font-medium leading-relaxed text-neutral-300">
            Styx is a private beta for no-contact recovery. Daily accountability and
            a small test-money commitment help you hold the line on the nights it is
            hardest — without pretending this phase is more than it is.
          </p>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-red-400">
            iOS private beta · Test-money pilot · US allowlist
          </p>

          <div className="mt-10 space-y-6">
            <div>
              <h2 className="text-lg font-black text-white">The hard part</h2>
              <p className="mt-2 text-base leading-7 text-neutral-400">
                The boundary is easy to set and brutal to keep at 1 a.m. Willpower
                alone breaks when the urge spikes and no one is watching.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-black text-white">How it works</h2>
              <ul className="mt-3 space-y-3 text-base leading-7 text-neutral-400">
                <li className="flex items-start gap-3">
                  <ShieldCheck
                    className="mt-1 h-5 w-5 shrink-0 text-red-500"
                    aria-hidden="true"
                  />
                  Make a daily check-in commitment and put a small test-money stake
                  behind it.
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck
                    className="mt-1 h-5 w-5 shrink-0 text-red-500"
                    aria-hidden="true"
                  />
                  Invite one trusted person so the boundary is reinforced by real
                  accountability.
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck
                    className="mt-1 h-5 w-5 shrink-0 text-red-500"
                    aria-hidden="true"
                  />
                  Get through the urge with the ten-minute reset tool, then log the
                  clean day.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Single CTA: the waitlist form */}
        <div className="lg:pt-4">
          <Suspense fallback={null}>
            <BetaWaitlistForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
