'use client';

/**
 * The guided-demo overlay.
 *
 * Renders two things over the real product, never a mock of it:
 *  - a synced side panel explaining the current route, at the depth the viewer
 *    chose, with the route's truth label always visible; and
 *  - numbered tooltips anchored to real elements on the page.
 *
 * It is inert unless the build is a demo build, so a real user session can never
 * see it: see isGuidedTourEnabled() below.
 *
 * Design constraints worth keeping:
 *  - The engine knows nothing about any specific route. Everything it renders
 *    comes from lib/guided-tour/registry.ts, so widening coverage is a data edit.
 *  - A step whose selector matches nothing is dropped, not rendered as an error.
 *    A UI change should degrade the tour, never break the demo underneath it.
 *  - The panel never invents a claim. Its truth label is the registry's, and the
 *    registry's vocabulary is asserted against /tour by the recorder.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  PERSONA_ACCOUNTS,
  TOUR_ORDER,
  TRUTH_LABEL_TEXT,
  matchTourRoute,
  type TourRoute,
  type TourStep,
  type TruthLabel,
} from '../../lib/guided-tour/registry';
import {
  getViewerName,
  registerSession,
  sendNote,
  setViewerName,
  trackEvents,
} from '../../lib/guided-tour/feedback';

/** Audience depth. `layperson` sees the summary only; everyone else sees mechanism too. */
const AUDIENCES = [
  { id: 'layperson', label: 'New to this' },
  { id: 'tester', label: 'User tester' },
  { id: 'investor', label: 'Investor' },
  { id: 'operator', label: 'Operator' },
] as const;

type AudienceId = (typeof AUDIENCES)[number]['id'];

const AUDIENCE_STORAGE_KEY = 'styx.guidedTour.audience';
const OPEN_STORAGE_KEY = 'styx.guidedTour.open';

const PANEL_WIDTH = 380;
const PANEL_TAB_WIDTH = 44;

const LABEL_STYLES: Record<TruthLabel, string> = {
  working: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
  beta: 'border-amber-500/40 bg-amber-950/40 text-amber-300',
  future: 'border-sky-500/40 bg-sky-950/40 text-sky-300',
};

/**
 * The tour ships only in demo builds. Both flags are inlined at build time, so a
 * production bundle contains no tour code path that can be switched on at runtime.
 */
export function isGuidedTourEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_STYX_GUIDED_TOUR === 'true' ||
    process.env.NEXT_PUBLIC_STYX_TEST_MONEY_MODE === 'true'
  );
}

/** Resolves a step selector to an element. `text=` matches by visible text. */
function resolveStepElement(selector: string): HTMLElement | null {
  if (!selector.startsWith('text=')) {
    try {
      return document.querySelector<HTMLElement>(selector);
    } catch {
      return null;
    }
  }
  const needle = selector.slice(5).trim().toLowerCase();
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,span,button,a,div,td,th,li'),
  );
  // Prefer the smallest element containing the text: the deepest match is the
  // label itself rather than a wrapper that spans half the page.
  let best: HTMLElement | null = null;
  for (const element of candidates) {
    const text = element.textContent?.trim().toLowerCase();
    if (!text || !text.includes(needle)) continue;
    if (element.closest('[data-guided-tour]')) continue;
    if (!best || text.length < (best.textContent?.trim().length ?? Infinity)) best = element;
  }
  return best;
}

type AnchoredStep = TourStep & { index: number; top: number; left: number };

export default function GuidedTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [audience, setAudience] = useState<AudienceId>('layperson');
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [anchored, setAnchored] = useState<AnchoredStep[]>([]);
  const [viewerName, setViewerNameState] = useState('');
  const [note, setNote] = useState('');
  const [noteStatus, setNoteStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  // Where the current route was entered, so a route_view can carry real dwell time
  // rather than a bare count. A count says which pages were opened; dwell says
  // which ones held anyone's attention, which is the question worth asking.
  const enteredAt = useRef<number>(Date.now());
  const previousPath = useRef<string | null>(null);
  const flushed = useRef(false);

  const route = useMemo<TourRoute | undefined>(
    () => (pathname ? matchTourRoute(pathname) : undefined),
    [pathname],
  );

  const position = useMemo(() => {
    if (!route) return { index: -1, total: TOUR_ORDER.length };
    return { index: TOUR_ORDER.findIndex((entry) => entry.path === route.path), total: TOUR_ORDER.length };
  }, [route]);

  useEffect(() => {
    const storedAudience = window.localStorage.getItem(AUDIENCE_STORAGE_KEY) as AudienceId | null;
    if (storedAudience && AUDIENCES.some((entry) => entry.id === storedAudience)) {
      setAudience(storedAudience);
    }
    const storedOpen = window.localStorage.getItem(OPEN_STORAGE_KEY);
    if (storedOpen !== null) setOpen(storedOpen === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem(AUDIENCE_STORAGE_KEY, audience);
  }, [audience]);

  // Announce this browser once. Everyone in the room shares the same synthetic
  // accounts, so a per-browser id plus a name they type is the only attribution
  // that means anything.
  useEffect(() => {
    if (!isGuidedTourEnabled()) return;
    const stored = getViewerName();
    setViewerNameState(stored);
    registerSession(stored, audience);
    // Intentionally mount-only: re-registering on every audience change would
    // turn one viewer into many.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the previous route's dwell when the path changes, and again when the
  // tab is hidden or closed -- otherwise the last route every viewer looked at,
  // often the one that mattered most, is the one that never reports.
  useEffect(() => {
    if (!isGuidedTourEnabled()) return undefined;

    const flush = () => {
      const from = previousPath.current;
      if (!from || flushed.current) return;
      const dwellMs = Date.now() - enteredAt.current;
      if (dwellMs < 400) return; // a pass-through redirect is not a visit
      // Exactly once per route. A browser navigation fires BOTH visibilitychange
      // and pagehide, so an unguarded flush double-counts every view and doubles
      // every dwell figure -- quietly, and in the direction that flatters the demo.
      flushed.current = true;
      trackEvents([{ type: 'route_view', route: from, dwellMs }]);
    };

    flush();
    previousPath.current = pathname ?? null;
    enteredAt.current = Date.now();
    flushed.current = false;

    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, [pathname]);

  useEffect(() => {
    window.localStorage.setItem(OPEN_STORAGE_KEY, String(open));
  }, [open]);

  // Reserve space rather than covering the product. An overlay panel clips the
  // right-hand column of every wide route -- on /dashboard it hides the Truth Log
  // entries, which is the one thing the chapter is there to show.
  useEffect(() => {
    if (!isGuidedTourEnabled() || !route) return undefined;
    const previous = document.body.style.paddingRight;
    document.body.style.paddingRight = open ? `${PANEL_WIDTH}px` : `${PANEL_TAB_WIDTH}px`;
    return () => {
      document.body.style.paddingRight = previous;
    };
  }, [open, route]);

  // Anchor the markers after the route's own data has had a chance to render,
  // and keep them attached through scroll and resize.
  useEffect(() => {
    setActiveStep(null);
    if (!route?.steps?.length) {
      setAnchored([]);
      return;
    }
    let frame = 0;
    const reposition = () => {
      const next: AnchoredStep[] = [];
      route.steps?.forEach((step, index) => {
        const element = resolveStepElement(step.selector);
        if (!element) return; // Missing element: drop the marker, keep the route.
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        next.push({ ...step, index, top: rect.top + window.scrollY, left: rect.left + window.scrollX });
      });
      setAnchored(next);
    };
    const settle = window.setTimeout(reposition, 700);
    const onScrollOrResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(reposition);
    };
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.clearTimeout(settle);
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [route, pathname]);

  const go = useCallback(
    (delta: number) => {
      if (position.index < 0) return;
      const next = TOUR_ORDER[position.index + delta];
      if (next) router.push(next.path.replace(/\[[^\]]+\]/g, 'demo'));
    },
    [position.index, router],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
      if (event.key === 'Escape') setActiveStep(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  if (!isGuidedTourEnabled() || !route) return null;

  const showDetail = audience !== 'layperson';
  const personaAccount = route.persona === 'none' ? null : PERSONA_ACCOUNTS[route.persona];

  return (
    <div data-guided-tour="root">
      {/* Anchored markers over the real UI. */}
      {anchored.map((step) => (
        <div
          key={`${route.path}-${step.index}`}
          data-guided-tour="marker"
          style={{ position: 'absolute', top: step.top - 12, left: step.left - 12, zIndex: 2147483000 }}
        >
          <button
            type="button"
            aria-label={`Explain: ${step.title}`}
            onClick={() => {
              const opening = activeStep !== step.index;
              setActiveStep(opening ? step.index : null);
              // Only opens are tracked. Which explanations people actually reach
              // for is the signal; closing one says nothing.
              if (opening) {
                trackEvents([{ type: 'tooltip_open', route: route.path, detail: step.title }]);
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-500 text-xs font-black text-black shadow-lg transition hover:scale-110"
          >
            {step.index + 1}
          </button>
          {activeStep === step.index && (
            <div className="mt-2 w-72 rounded-2xl border border-amber-500/40 bg-neutral-950 p-4 text-left shadow-2xl">
              <p className="text-xs font-black uppercase tracking-widest text-amber-300">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-300">{step.body}</p>
            </div>
          )}
        </div>
      ))}

      {/* The synced panel. */}
      <aside
        data-guided-tour="panel"
        className="fixed bottom-0 right-0 top-0 z-[2147483100] flex w-[380px] max-w-full flex-col border-l border-neutral-800 bg-neutral-950/95 text-white backdrop-blur"
        style={{ transform: open ? 'translateX(0)' : 'translateX(calc(100% - 44px))', transition: 'transform 200ms' }}
      >
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse the guided tour' : 'Expand the guided tour'}
          className="absolute left-0 top-1/2 h-24 w-11 -translate-x-full rounded-l-xl border border-r-0 border-neutral-800 bg-neutral-950 text-xs font-black uppercase tracking-widest text-neutral-400"
        >
          <span style={{ writingMode: 'vertical-rl' }}>{open ? 'Hide' : 'Tour'}</span>
        </button>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500">
              {route.chapter}
            </span>
            <span className="text-[11px] font-bold text-neutral-600">
              {position.index + 1} / {position.total}
            </span>
          </div>

          <span
            className={`mt-4 inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${LABEL_STYLES[route.label]}`}
          >
            {TRUTH_LABEL_TEXT[route.label]}
          </span>

          <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight">{route.title}</h2>
          <p className="mt-3 text-[15px] leading-7 text-neutral-300">{route.summary}</p>
          {showDetail && (
            <p className="mt-3 border-l-2 border-neutral-800 pl-4 text-sm leading-6 text-neutral-400">
              {route.detail}
            </p>
          )}

          {personaAccount && (
            <p className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-xs leading-5 text-neutral-400">
              This chapter is written for the synthetic account{' '}
              <span className="font-bold text-neutral-200">{personaAccount}</span>. If the page looks
              empty or asks you to sign in, you are viewing it as someone else.
            </p>
          )}

          {anchored.length > 0 && (
            <p className="mt-5 text-xs leading-5 text-neutral-500">
              {anchored.length} numbered marker{anchored.length === 1 ? '' : 's'} on this page. Click one
              to see what that element is.
            </p>
          )}

          <div className="mt-6 border-t border-neutral-800 pt-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500">
              Explain it for
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AUDIENCES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    setAudience(entry.id);
                    trackEvents([
                      { type: 'audience_change', route: route.path, detail: entry.id },
                    ]);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    audience === entry.id
                      ? 'border-white bg-white text-black'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-800 pt-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500">
              Leave a note on this page
            </p>
            <input
              value={viewerName}
              onChange={(event) => {
                setViewerNameState(event.target.value);
                setViewerName(event.target.value);
              }}
              placeholder="Your name (optional)"
              className="mt-3 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600"
            />
            <textarea
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                if (noteStatus !== 'idle') setNoteStatus('idle');
              }}
              rows={3}
              placeholder="Confusing? Wrong? Missing? Say it here."
              className="mt-2 w-full resize-y rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm leading-6 text-white placeholder:text-neutral-600"
            />
            <button
              type="button"
              disabled={!note.trim() || noteStatus === 'saving'}
              onClick={async () => {
                setNoteStatus('saving');
                const ok = await sendNote(route.path, note.trim());
                if (ok) {
                  setNote('');
                  setNoteStatus('saved');
                  trackEvents([{ type: 'nav', route: route.path, detail: 'note_added' }]);
                } else {
                  // Never silently swallow this one: a viewer who thinks their
                  // note was recorded and finds it missing is worse than no note.
                  setNoteStatus('failed');
                }
              }}
              className="mt-2 w-full rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-black disabled:opacity-30"
            >
              {noteStatus === 'saving' ? 'Sending…' : 'Send note'}
            </button>
            {noteStatus === 'saved' && (
              <p className="mt-2 text-xs font-bold text-emerald-400">Saved. Thank you.</p>
            )}
            {noteStatus === 'failed' && (
              <p className="mt-2 text-xs leading-5 text-amber-300">
                Could not reach the note collector, so this was <strong>not</strong> saved. Tell the
                presenter — they may not have started it.
              </p>
            )}
            <p className="mt-3 text-[11px] leading-5 text-neutral-600">
              Notes and which pages you opened are recorded on the presenter&apos;s machine to
              improve the demo. No account data, page content, or device details are collected.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-neutral-800 p-4">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={position.index <= 0}
            className="rounded-full border border-neutral-700 px-4 py-2 text-sm font-bold text-neutral-300 disabled:opacity-30"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={position.index < 0 || position.index >= position.total - 1}
            className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </aside>
    </div>
  );
}
