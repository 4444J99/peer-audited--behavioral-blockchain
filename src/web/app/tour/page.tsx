import Link from 'next/link';
import { ArrowRight, CheckCircle2, LockKeyhole, ReceiptText, UsersRound } from 'lucide-react';

const truthLabels = {
  working: 'Working today',
  beta: 'Test-money beta',
  future: 'Future enterprise capability',
} as const;

function TruthLabel({ kind }: { kind: keyof typeof truthLabels }) {
  const colors = {
    working: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
    beta: 'border-amber-500/40 bg-amber-950/40 text-amber-300',
    future: 'border-sky-500/40 bg-sky-950/40 text-sky-300',
  } as const;
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${colors[kind]}`}>
      {truthLabels[kind]}
    </span>
  );
}

export default function TourPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white sm:px-10">
      <div className="mx-auto max-w-5xl space-y-12">
        <header className="space-y-5 border-b border-neutral-800 pb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-xl font-black text-black">S</span>
              <span className="font-black tracking-[0.25em] text-neutral-300">STYX TOUR</span>
            </div>
            <Link href="/pitch" className="text-sm font-bold text-neutral-400 hover:text-white">
              View existing pitch →
            </Link>
          </div>
          <TruthLabel kind="beta" />
          <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">A clear accountability demo, with the boundary visible.</h1>
          <p className="max-w-3xl text-lg leading-8 text-neutral-300">
            Styx is a private, synthetic demonstration of a commitment record: make a promise, submit evidence, and preserve an auditable result. It is not a real-money service, a clinical service, or an enterprise deployment.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
            <TruthLabel kind="working" />
            <h2 className="mt-5 text-xl font-black">1. Make a commitment</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-400">A participant chooses a specific behavior and a test-credit stake. The demo starts with synthetic accounts and no payment instrument.</p>
          </article>
          <article className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
            <TruthLabel kind="working" />
            <h2 className="mt-5 text-xl font-black">2. Submit and review proof</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-400">The commitment shows a proof record and a review outcome. The ledger keeps the test-credit event and result together for inspection.</p>
          </article>
          <article className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
            <TruthLabel kind="working" />
            <h2 className="mt-5 text-xl font-black">3. Read the record</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-400">The participant can see commitments, a behavioral check-in history, and test-credit ledger entries without representing that real money moved.</p>
          </article>
        </section>

        <section className="rounded-3xl border border-amber-700/40 bg-amber-950/20 p-8">
          <div className="flex items-start gap-4">
            <ReceiptText className="mt-1 text-amber-300" />
            <div>
              <TruthLabel kind="beta" />
              <h2 className="mt-4 text-2xl font-black">Why the money and accounting boundary matters</h2>
              <p className="mt-3 max-w-3xl leading-7 text-neutral-300">
                This demo uses a ledger-only test-money rail. Entries make the accountability flow inspectable, but they do not charge a card, settle a transfer, custody funds, or create a real balance. A hosted, consented test-money beta needs its own operational proof before anyone outside the demo is invited.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-neutral-800 bg-neutral-900 p-7">
            <UsersRound className="text-red-400" />
            <TruthLabel kind="working" />
            <h2 className="mt-4 text-2xl font-black">Coach view: scoped, not a surveillance feed</h2>
            <p className="mt-3 leading-7 text-neutral-400">The seeded coach account demonstrates assigned-client review. The rehearsal focuses on commitment status and agreed signals, not on unnecessary source material or a clinical conclusion.</p>
            <p className="mt-4 text-sm font-bold text-neutral-200">Demo route: sign in as the synthetic coach, then open the practitioner view.</p>
          </article>
          <article className="rounded-3xl border border-neutral-800 bg-neutral-900 p-7">
            <LockKeyhole className="text-sky-300" />
            <TruthLabel kind="future" />
            <h2 className="mt-4 text-2xl font-black">Enterprise is a preview, not a procurement claim</h2>
            <p className="mt-3 leading-7 text-neutral-400">The enterprise screen demonstrates aggregate program oversight and tenant-scoped access in synthetic data. Hosting, verified geography, consent operations, security review, and procurement controls remain gates before an employer deployment.</p>
            <p className="mt-4 text-sm font-bold text-neutral-200">Demo route: synthetic enterprise admin → aggregate preview.</p>
          </article>
        </section>

        <section className="rounded-3xl border border-sky-800/40 bg-sky-950/20 p-8">
          <TruthLabel kind="future" />
          <h2 className="mt-4 text-2xl font-black">What is deliberately not being claimed</h2>
          <ul className="mt-4 space-y-3 text-neutral-300">
            <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-sky-300" />No real-money settlement, payment custody, pricing, or public launch.</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-sky-300" />No clinical outcome, diagnosis, treatment, or health-data promise.</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-sky-300" />No assertion that enterprise procurement or app-store readiness is complete.</li>
          </ul>
        </section>

        <footer className="flex flex-wrap gap-4 border-t border-neutral-800 pt-8">
          <Link href="/circles" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-black text-black hover:bg-neutral-200">Open synthetic demo index <ArrowRight size={16} /></Link>
          <Link href="/beta" className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-5 py-3 font-bold text-neutral-200 hover:border-neutral-400">Private beta waitlist</Link>
        </footer>
      </div>
    </main>
  );
}
