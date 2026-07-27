'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  HeartCrack,
  MessageCircleOff,
  Moon,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';

const BETA_CTA_HREF =
  '/beta?source=do-not-text-tonight&intent=no-contact-urge&utm_source=emergency_asset&utm_campaign=do_not_text_your_ex_tonight';

const feelings = [
  'lonely',
  'angry',
  'hopeful',
  'panicked',
  'curious',
  'ashamed',
];

const resetSteps = [
  {
    minute: '0:00',
    title: 'Put the phone face down',
    body: 'Do not delete the draft yet. Just stop feeding it. Put the screen down and let the first spike pass without a send button in sight.',
  },
  {
    minute: '2:00',
    title: 'Name the urge without obeying it',
    body: 'Say the sentence plainly: "I want contact because this moment hurts." Wanting contact is not the same as needing to act.',
  },
  {
    minute: '5:00',
    title: 'Replace the contact ritual',
    body: 'Drink water, stand up, and send the replacement note below to yourself or a trusted friend. Keep their name out of the thread.',
  },
  {
    minute: '10:00',
    title: 'Choose the next clean hour',
    body: 'You do not have to solve the breakup tonight. Your only job is to protect the next hour from becoming a message you regret.',
  },
];

const replacementNotes = [
  'I am having the urge to text them. I am not sending it tonight. I only need to get through the next ten minutes.',
  'I miss them, and I can still keep my boundary. Please remind me why I chose no contact.',
  'I am not available for this conversation tonight. I can survive the next hour without reopening the wound.',
];

export default function DoNotTextYourExTonightPage() {
  const [selectedFeeling, setSelectedFeeling] = useState(feelings[0]);
  const [urgeLevel, setUrgeLevel] = useState(7);
  const [activeStep, setActiveStep] = useState(0);
  const [replacementNote, setReplacementNote] = useState(replacementNotes[0]);

  const waveLabel = useMemo(() => {
    if (urgeLevel >= 8) {
      return 'This is a peak, not a command.';
    }
    if (urgeLevel >= 5) {
      return 'This is a wave. Give it a little more time.';
    }
    return 'The wave is lower. Do not restart it.';
  }, [urgeLevel]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 shadow-[0_0_32px_rgba(220,38,38,0.36)]">
              <MessageCircleOff className="h-5 w-5 text-black" aria-hidden="true" />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.28em] text-neutral-300">Styx</span>
          </div>
          <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-neutral-500 sm:flex">
            <Moon className="h-4 w-4 text-red-500" aria-hidden="true" />
            Tonight only
          </div>
        </div>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
          <div className="max-w-3xl">
            <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full border border-red-500/50 bg-red-600/10">
              <HeartCrack className="h-8 w-8 text-red-500" aria-hidden="true" />
            </div>
            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Do Not Text Your Ex Tonight
            </h1>
            <p className="mt-7 max-w-2xl text-xl font-medium leading-relaxed text-neutral-300">
              You are not weak for wanting contact. You are in the hardest part of the urge.
              Give this page ten minutes before you send anything.
            </p>
            <div className="mt-9 flex flex-wrap gap-3 text-sm font-bold text-neutral-300">
              <span className="rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2">No-contact recovery</span>
              <span className="rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2">Private beta</span>
              <span className="rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2">Test-money pilot</span>
            </div>
            <p className="mt-8 max-w-xl text-sm leading-6 text-neutral-500">
              If you might hurt yourself or someone else, contact local emergency services now.
              This tool is for an urge to break no contact, not a crisis response.
            </p>
          </div>

          <div className="border border-neutral-800 bg-neutral-900/80 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.42)] sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
              <section className="border border-neutral-800 bg-black/35 p-5">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-normal text-white">Ten-minute reset</h2>
                    <p className="mt-1 text-sm text-neutral-500">Pick the current minute. Do the smallest next action.</p>
                  </div>
                  <TimerReset className="h-8 w-8 text-red-500" aria-hidden="true" />
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  {resetSteps.map((step, index) => (
                    <button
                      key={step.minute}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      className={`min-h-[76px] border px-3 py-3 text-left transition-colors ${
                        activeStep === index
                          ? 'border-red-500 bg-red-600 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-600'
                      }`}
                    >
                      <span className="block text-xs font-black uppercase tracking-[0.18em]">{step.minute}</span>
                      <span className="mt-2 block text-sm font-bold leading-snug">{step.title}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-5 min-h-[160px] border border-neutral-800 bg-neutral-950 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                    <div>
                      <h3 className="text-xl font-black text-white">{resetSteps[activeStep].title}</h3>
                      <p className="mt-3 text-base leading-7 text-neutral-300">{resetSteps[activeStep].body}</p>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="border border-red-900/60 bg-red-950/25 p-5">
                <ShieldCheck className="mb-5 h-8 w-8 text-red-400" aria-hidden="true" />
                <h2 className="text-xl font-black leading-tight text-white">Need stronger structure after tonight?</h2>
                <p className="mt-3 text-sm leading-6 text-red-100/78">
                  Join the small iOS private beta for no-contact accountability. The link carries
                  this page source so the funnel keeps the urge moment visible.
                </p>
                <Link
                  href={BETA_CTA_HREF}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-white px-5 py-4 text-sm font-black uppercase tracking-normal text-black transition-colors hover:bg-neutral-200"
                >
                  Join the Private Beta
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </aside>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <section className="border border-neutral-800 bg-neutral-950 p-5">
                <h2 className="text-lg font-black text-white">What are you feeling right now?</h2>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {feelings.map((feeling) => (
                    <button
                      key={feeling}
                      type="button"
                      onClick={() => setSelectedFeeling(feeling)}
                      className={`min-h-[44px] border px-3 text-sm font-bold capitalize transition-colors ${
                        selectedFeeling === feeling
                          ? 'border-red-500 bg-red-600 text-white'
                          : 'border-neutral-800 bg-black text-neutral-300 hover:border-neutral-600'
                      }`}
                    >
                      {feeling}
                    </button>
                  ))}
                </div>

                <label htmlFor="urge-level" className="mt-6 block text-sm font-bold text-neutral-400">
                  Urge level: <span className="text-white">{urgeLevel}/10</span>
                </label>
                <input
                  id="urge-level"
                  type="range"
                  min="1"
                  max="10"
                  value={urgeLevel}
                  onChange={(event) => setUrgeLevel(Number(event.target.value))}
                  className="mt-3 w-full accent-red-600"
                />
                <p className="mt-4 text-sm font-bold text-red-300">{waveLabel}</p>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Feeling {selectedFeeling} does not require contact. It requires a safer next action.
                </p>
              </section>

              <section className="border border-neutral-800 bg-neutral-950 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-white">Send this instead</h2>
                    <p className="mt-1 text-sm text-neutral-500">Use a friend, notes app, or your own inbox. Do not use their thread.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = replacementNotes.indexOf(replacementNote);
                      setReplacementNote(replacementNotes[(currentIndex + 1) % replacementNotes.length]);
                    }}
                    className="min-h-[40px] border border-neutral-700 px-4 text-sm font-black text-neutral-200 transition-colors hover:border-red-500 hover:text-white"
                  >
                    Swap note
                  </button>
                </div>
                <textarea
                  aria-label="Replacement no-contact note"
                  value={replacementNote}
                  onChange={(event) => setReplacementNote(event.target.value)}
                  className="mt-4 min-h-[132px] w-full resize-none border border-neutral-800 bg-black p-4 text-base leading-7 text-neutral-100 outline-none transition-colors focus:border-red-500"
                />
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
