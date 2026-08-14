/**
 * Snapshot interception at the `fetch` boundary.
 *
 * WHY THIS EXISTS, and why intercepting in api-client was not enough.
 *
 * `services/api-client.ts` is *a* HTTP client, not *the* HTTP client. Eighteen
 * call sites in `app/` and `components/` call `fetch('/api/...')` directly --
 * `/realms`, `/kyc`, `/practitioner`, the `/behavioral/*` pages and
 * `/admin/cac-ltv` among them. Hooking only api-client covered 40 of 48 routes
 * and left 8 issuing a real network request on a static host, where it can only
 * 404. Those pages then rendered "API 404" to the viewer.
 *
 * That is the exact failure `services/snapshot.ts` documents itself as existing
 * to prevent -- a plausible, wrong screen -- and it was invisible to every gate:
 * the export builds, all 77 pages render, and each route still answers HTTP 200
 * because the error lives *inside* the page.
 *
 * So the interception belongs at the boundary every client necessarily crosses.
 * A route added tomorrow with a hand-rolled `fetch` is covered without anyone
 * remembering this file exists, which is the only property that makes the
 * guarantee durable.
 *
 * It is inert outside snapshot mode: `isSnapshotMode()` is a build-time constant,
 * so a normal build keeps its real network stack untouched.
 */
import { isSnapshotMode, snapshotRespond } from './snapshot';

let installed = false;

/** Resolves whatever fetch() accepts into an absolute URL, or null if unparseable. */
function resolveUrl(input: RequestInfo | URL): URL | null {
  try {
    if (typeof input === 'string') return new URL(input, window.location.href);
    if (input instanceof URL) return input;
    return new URL(input.url, window.location.href);
  } catch {
    return null;
  }
}

function resolveMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return String(init.method).toUpperCase();
  if (typeof input !== 'string' && !(input instanceof URL)) return input.method.toUpperCase();
  return 'GET';
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Patches window.fetch so same-origin /api/* requests are answered from the
 * captured fixtures. Everything else -- including snapshot.ts's own fetch of
 * /demo-snapshot/<persona>.json -- passes straight through to the real fetch,
 * which is captured before the patch to make that unambiguous.
 */
export function installSnapshotFetch(): void {
  if (!isSnapshotMode()) return;
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = resolveUrl(input);
    if (!url || url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
      return nativeFetch(input as RequestInfo, init);
    }

    const path = url.pathname.slice('/api'.length) + (url.search || '');
    const result = await snapshotRespond<unknown>(path, resolveMethod(input, init));
    if (result.ok) return jsonResponse(result.data, 200);

    // A 404 means no fixture was captured for this endpoint. Record it where a
    // verifier can read it, because the on-screen result is NOT reliably visible:
    // several pages swallow the error and render their zero state, which is how
    // /admin/cac-ltv showed "$0 revenue, 0 users" -- a sentence about the business
    // that no one wrote and that happened to be false. A page rendering nonsense
    // silently is exactly what this snapshot must never do.
    if (result.status === 404) {
      const misses = (window as Window & { __STYX_SNAPSHOT_MISSES__?: string[] });
      misses.__STYX_SNAPSHOT_MISSES__ = misses.__STYX_SNAPSHOT_MISSES__ || [];
      misses.__STYX_SNAPSHOT_MISSES__.push(path);
    }

    // Callers read `message` off the error body (see practitionerFetch, kycFetch),
    // so the honest explanation reaches the screen through code that already exists
    // rather than needing every page to learn about snapshot mode.
    return jsonResponse({ message: result.message, error: 'SNAPSHOT_READ_ONLY' }, result.status);
  };
}
