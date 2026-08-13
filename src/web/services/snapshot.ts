/**
 * Snapshot mode: the demo running with no backend at all.
 *
 * The Cloudflare build is a static export. There is no API, no PostgreSQL and no
 * Redis behind it, so every read is answered from fixtures captured off a real,
 * verified local demo run (see scripts/demo/capture-snapshot.mjs) and every write
 * is refused in plain language.
 *
 * Two honesty rules this file holds:
 *
 *  1. A write must never *appear* to succeed. Someone clicking "create contract" on
 *     the hosted snapshot has to be told it is read-only, not shown a fake success
 *     that makes the demo look more capable than it is.
 *  2. A missing fixture is reported, not faked. Returning empty data for a path we
 *     never captured would render a plausible, wrong screen -- the failure mode that
 *     is hardest to notice and worst to show an investor.
 */

const PERSONA_KEY = 'styx.snapshot.persona';

/** Inlined at build time, so a normal build contains no snapshot code path. */
export function isSnapshotMode(): boolean {
  return process.env.NEXT_PUBLIC_STYX_SNAPSHOT === 'true';
}

/** Synthetic accounts, mapped to the fixture file captured for each. */
export const SNAPSHOT_PERSONAS: Record<string, string> = {
  'river@demo.styx.protocol': 'river',
  'dr.moira@demo.styx.protocol': 'moira',
  'hr.lead@acheron.example': 'hr',
  'alecto@demo.styx.protocol': 'alecto',
  'sage@demo.styx.protocol': 'sage',
};

const DEFAULT_PERSONA = 'river';

export function getPersona(): string {
  if (typeof window === 'undefined') return DEFAULT_PERSONA;
  return window.localStorage.getItem(PERSONA_KEY) || DEFAULT_PERSONA;
}

export function setPersona(persona: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PERSONA_KEY, persona);
  // Fixtures are per persona, so a switch invalidates everything already resolved.
  cache.clear();
}

export type SnapshotResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

type Fixture = Record<string, unknown>;

const cache = new Map<string, Promise<Fixture>>();

async function loadFixture(persona: string): Promise<Fixture> {
  const existing = cache.get(persona);
  if (existing) return existing;
  // Pages serves this export at the site root, so an absolute path is correct and a
  // relative one would break on trailing-slash routes like /realms/recovery-abstinence/.
  const pending = fetch(`/demo-snapshot/${persona}.json`, { cache: 'force-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`fixture ${persona}: HTTP ${response.status}`);
      return response.json() as Promise<Fixture>;
    })
    .catch((error) => {
      cache.delete(persona);
      throw error;
    });
  cache.set(persona, pending);
  return pending;
}

const READ_ONLY_MESSAGE =
  'This is the shared read-only demo, so nothing can be created or changed here. ' +
  'Everything you can see is real synthetic data from a verified demo run. Ask for the ' +
  'live walkthrough if you want to try creating a commitment yourself.';

/**
 * Answers a request from captured fixtures.
 *
 * `path` is the API path as api-client would have called it, e.g. "/dashboard/summary".
 */
export async function snapshotRespond<T>(path: string, method: string): Promise<SnapshotResult<T>> {
  const verb = method.toUpperCase();

  // Sign-in is a persona switch, not an authentication.
  if (verb === 'POST' && path === '/auth/login') {
    // A fixed placeholder, not a credential: the snapshot has no auth to grant.
    return { ok: true, data: { token: 'snapshot-session', userId: getPersona() } as T }; // allow-secret: placeholder session marker
  }
  if (verb === 'POST' && path === '/auth/logout') {
    return { ok: true, data: {} as T };
  }
  if (verb === 'GET' && path === '/auth/csrf') {
    return { ok: true, data: { csrfToken: 'snapshot-csrf' } as T };
  }

  if (verb !== 'GET') {
    return { ok: false, status: 405, message: READ_ONLY_MESSAGE };
  }

  let fixture: Fixture;
  try {
    fixture = await loadFixture(getPersona());
  } catch {
    return {
      ok: false,
      status: 503,
      message: 'The demo snapshot data could not be loaded. Reload the page, or ask for the live walkthrough.',
    };
  }

  // Exact path first, then path without its query string: the capture records both
  // shapes and a route may add a cache-busting parameter at runtime.
  const key = `GET ${path}`;
  const bare = `GET ${path.split('?')[0]}`;
  if (key in fixture) return { ok: true, data: fixture[key] as T };
  if (bare in fixture) return { ok: true, data: fixture[bare] as T };

  return {
    ok: false,
    status: 404,
    message: `This screen is not part of the captured demo snapshot (${path}). Ask for the live walkthrough to see it.`,
  };
}
