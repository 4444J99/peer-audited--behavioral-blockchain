import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Styx | The Concentric Circles',
  description:
    'A guided index of every live Styx demo surface, organized by product circle: consumer wedge, commitment loop, proof integrity, retention pods, and enterprise.',
};

interface DemoSurface {
  href: string;
  label: string;
  look: string;
}

interface Circle {
  letter: string;
  name: string;
  tagline: string;
  accent: string;
  ring: string;
  surfaces: DemoSurface[];
}

const CIRCLES: Circle[] = [
  {
    letter: 'α',
    name: 'Circle Alpha — The Wedge',
    tagline: 'Consumer no-contact recovery: the public face and the funnel.',
    accent: 'text-red-500',
    ring: 'border-red-600/40',
    surfaces: [
      {
        href: '/',
        label: 'Landing',
        look: 'Recovery-first framing with a single CTA into the beta — no money or audit language above the fold.',
      },
      {
        href: '/beta',
        label: 'Beta Waitlist',
        look: 'The signup funnel: source attribution, qualification fields, and the confirmation flow that feeds cohorts.',
      },
    ],
  },
  {
    letter: 'β',
    name: 'Circle Beta — The Loop',
    tagline: 'Commitment contracts: stake, attest daily, resolve.',
    accent: 'text-orange-400',
    ring: 'border-orange-500/40',
    surfaces: [
      {
        href: '/contracts/new',
        label: 'New Oath',
        look: 'Contract creation — oath category, stake amount, duration, and verification method form the core commitment device.',
      },
    ],
  },
  {
    letter: 'γ',
    name: 'Circle Gamma — Proof Integrity',
    tagline: 'Trust machinery: anonymous audit, identity, and jurisdiction control.',
    accent: 'text-yellow-400',
    ring: 'border-yellow-500/40',
    surfaces: [
      {
        href: '/fury',
        label: 'Fury Queue',
        look: 'The anonymous peer-audit bench: masked subject aliases, honeypot reveals, and PASS/FAIL verdicts.',
      },
      {
        href: '/kyc',
        label: 'Identity Verification',
        look: 'KYC and age-check document flow — the compliance gate between test-money and real-money tiers.',
      },
      {
        href: '/admin/jurisdictions',
        label: 'Jurisdiction Switchboard',
        look: 'Per-region disposition modes and tiering — how the protocol adapts stake handling to local law.',
      },
    ],
  },
  {
    letter: 'δ',
    name: 'Circle Delta — Retention',
    tagline: 'Pods, realms, and the social fabric that keeps streaks alive.',
    accent: 'text-green-400',
    ring: 'border-green-500/40',
    surfaces: [
      {
        href: '/tavern',
        label: 'The Tavern Board',
        look: 'Real-time network activity — the ambient proof that other people are holding their lines too.',
      },
      {
        href: '/realms',
        label: 'Behavioral Realms',
        look: 'Domain separation: each behavioral stream gets its own realm, oracle, and specialized auditors.',
      },
    ],
  },
  {
    letter: 'Ω',
    name: 'Circle Omega — The Enterprise',
    tagline: 'B2B and clinical tiers built on the same attestation substrate.',
    accent: 'text-blue-400',
    ring: 'border-blue-500/40',
    surfaces: [
      {
        href: '/practitioner',
        label: 'Practitioner Console',
        look: 'Composite risk profiles, trend detection, and journal alerts for a clinician’s assigned clients.',
      },
      {
        href: '/hr',
        label: 'Enterprise Analytics',
        look: 'Anonymized workforce metrics — completion rate and risk exposure with employee PII structurally redacted.',
      },
    ],
  },
];

export default function CirclesPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      <header className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-600/60 shadow-[0_0_40px_rgba(220,38,38,0.3)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-600/60">
            <div className="h-5 w-5 rounded-full bg-red-600" />
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase">
          The Concentric Circles
        </h1>
        <p className="mt-3 text-neutral-400 leading-7 max-w-2xl mx-auto">
          Styx is built outward from a single wedge — no-contact recovery — through proof
          integrity and retention mechanics to the enterprise tier. Each circle below is live
          in this demo environment; every link opens a working surface seeded with the demo
          cohort.
        </p>
        <p className="mt-2 text-xs text-neutral-600 uppercase tracking-widest">
          Demo logins &amp; seed instructions: scripts/demo/README.md
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-20 space-y-8">
        {CIRCLES.map((circle) => (
          <section
            key={circle.name}
            className={`rounded-2xl border ${circle.ring} bg-neutral-900 p-6 md:p-8`}
          >
            <div className="flex items-baseline gap-4 mb-1">
              <span
                className={`text-3xl font-black ${circle.accent}`}
                aria-hidden="true"
              >
                {circle.letter}
              </span>
              <h2 className="text-xl font-black tracking-tight uppercase">{circle.name}</h2>
            </div>
            <p className="text-sm text-neutral-500 mb-6">{circle.tagline}</p>

            <ul className="space-y-4">
              {circle.surfaces.map((surface) => (
                <li
                  key={surface.href}
                  className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4"
                >
                  <Link
                    href={surface.href}
                    className="shrink-0 font-bold text-white underline decoration-neutral-700 underline-offset-4 hover:decoration-red-500 transition-colors"
                  >
                    {surface.label}
                  </Link>
                  <span className="text-sm text-neutral-400 leading-6">
                    <span className="text-neutral-600 uppercase text-xs tracking-wider mr-2">
                      What to look at:
                    </span>
                    {surface.look}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <footer className="text-center pt-4">
          <p className="text-xs text-neutral-600 uppercase tracking-widest">
            One substrate, five circles — attestation, stake, and audit all the way out.
          </p>
        </footer>
      </main>
    </div>
  );
}
