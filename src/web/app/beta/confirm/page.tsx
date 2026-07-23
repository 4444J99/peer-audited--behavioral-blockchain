'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';

type Status = 'confirming' | 'confirmed' | 'error';

function ConfirmInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('confirming');

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setStatus('error');
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/beta-waitlist/confirm?token=${encodeURIComponent(token)}`,
        );
        if (!cancelled) setStatus(res.ok ? 'confirmed' : 'error');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === 'confirmed') {
    return (
      <div className="text-center">
        <CheckCircle2
          className="mx-auto mb-5 h-12 w-12 text-red-500"
          aria-hidden="true"
        />
        <h1 className="text-3xl font-black uppercase text-white">
          Email confirmed
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-300">
          You are confirmed for the Styx private-beta waitlist. We admit small
          US-only iOS cohorts and will email you when your spot opens.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <XCircle
          className="mx-auto mb-5 h-12 w-12 text-neutral-500"
          aria-hidden="true"
        />
        <h1 className="text-3xl font-black uppercase text-white">
          Link not recognized
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-400">
          This confirmation link is missing or no longer valid. You can rejoin the
          waitlist and we will send a fresh link.
        </p>
        <Link
          href="/beta"
          className="mt-7 inline-flex items-center justify-center bg-white px-5 py-3 text-sm font-black uppercase tracking-normal text-black transition-colors hover:bg-neutral-200"
        >
          Back to the waitlist
        </Link>
      </div>
    );
  }

  return (
    <p className="text-center text-base font-bold uppercase tracking-[0.18em] text-neutral-400">
      Confirming…
    </p>
  );
}

export default function BetaConfirmPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="w-full max-w-md border border-neutral-800 bg-neutral-900/80 p-8">
        <Suspense fallback={null}>
          <ConfirmInner />
        </Suspense>
      </div>
    </main>
  );
}
