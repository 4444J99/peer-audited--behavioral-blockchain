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

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  void post('/session', { sessionId: getSessionId(), name, audience });
}

export function trackEvents(events: FeedbackEvent[]): void {
  if (!events.length) return;
  void post('/events', { sessionId: getSessionId(), events });
}

export function sendNote(route: string, text: string): Promise<boolean> {
  return post('/notes', {
    sessionId: getSessionId(),
    name: getViewerName(),
    route,
    text,
  });
}
