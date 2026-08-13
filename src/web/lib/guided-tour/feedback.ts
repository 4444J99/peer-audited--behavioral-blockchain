/**
 * Client half of the demo feedback collector.
 *
 * Three rules this module exists to enforce:
 *
 *  1. It must never affect the demo. Every call is fire-and-forget and swallows
 *     its own failures: if the collector is not running, the tour behaves exactly
 *     as it did before this file existed. A rehearsal must not break because
 *     telemetry is down.
 *  2. It addresses the collector by the SAME host the viewer already loaded the
 *     page from. Hardcoding 127.0.0.1 would work only on the presenter's machine
 *     and silently collect nothing from anyone else in the room -- which looks
 *     identical to "nobody interacted".
 *  3. It sends only what the viewer can see themselves: a random id, a name they
 *     typed, the route, and their own note. No identity, no page content.
 */

const SESSION_KEY = 'styx.guidedTour.sessionId';
const NAME_KEY = 'styx.guidedTour.name';

export type FeedbackEvent = {
  type: 'route_view' | 'tooltip_open' | 'audience_change' | 'nav';
  route: string;
  detail?: string;
  dwellMs?: number;
};

const collectorPort = process.env.NEXT_PUBLIC_STYX_FEEDBACK_PORT || '4312';

/** Same hostname the viewer used, so every device reports to the presenter's machine. */
function collectorBase(): string | null {
  if (typeof window === 'undefined') return null;
  return `${window.location.protocol}//${window.location.hostname}:${collectorPort}`;
}

/**
 * A random id from the platform CSPRNG, or nothing.
 *
 * There is deliberately no Math.random() fallback. This id is only a correlation
 * key for demo telemetry, but a predictable identifier is still the wrong thing to
 * mint, and every browser that can run this app has crypto.getRandomValues. If some
 * environment somehow lacks it, returning "" degrades to not tracking -- which is
 * the correct failure for a layer that must never affect the demo.
 */
function mintId(): string {
  const webCrypto: Crypto | undefined = typeof crypto !== 'undefined' ? crypto : undefined;
  if (!webCrypto) return '';

  // crypto.randomUUID is restricted to SECURE CONTEXTS, so it is undefined on
  // http://<lan-ip>:4311 -- which is precisely how the room opens this demo. The
  // TypeScript lib types declare it unconditionally, so this has to be a runtime
  // check; getRandomValues has no such restriction and is the real path here.
  const randomUUID = (webCrypto as Crypto & { randomUUID?: () => string }).randomUUID;
  if (typeof randomUUID === 'function') return randomUUID.call(webCrypto);

  const bytes = new Uint8Array(16);
  webCrypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = mintId();
    if (!id) return '';
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getViewerName(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(NAME_KEY) || '';
}

export function setViewerName(name: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NAME_KEY, name);
}

async function post(path: string, body: unknown): Promise<boolean> {
  const base = collectorBase();
  if (!base) return false;
  try {
    const response = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
    return response.ok;
  } catch {
    // Collector not running. Deliberately silent -- see rule 1 above.
    return false;
  }
}

export function registerSession(name: string, audience: string): void {
  const sessionId = getSessionId();
  if (!sessionId) return;
  void post('/session', { sessionId, name, audience });
}

export function trackEvents(events: FeedbackEvent[]): void {
  const sessionId = getSessionId();
  if (!sessionId || !events.length) return;
  void post('/events', { sessionId, events });
}

export function sendNote(route: string, text: string): Promise<boolean> {
  const sessionId = getSessionId();
  // A note without a session still deserves to reach the presenter, so this is the
  // one path that proceeds anonymously rather than dropping the viewer's words.
  return post('/notes', {
    sessionId: sessionId || 'anonymous',
    name: getViewerName(),
    route,
    text,
  });
}
