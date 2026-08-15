/**
 * Demo feedback collector — Cloudflare Worker edition.
 *
 * A faithful port of scripts/demo/feedback-server.mjs (the LAN/Render process)
 * for the hosted beta: same endpoints, same field cleaning, same summary shape,
 * so scripts/demo/feedback-report.mjs and the presenter read identical output.
 * Storage is Workers KV instead of NDJSON on disk — append-only records under
 * s:/e:/n: prefixed keys. See styx issue #894 for why the collector lives here
 * (free, no billing dependency) while the product data plane stays on Render.
 *
 * Auth: /summary exposes viewer names and notes, so on this public host it is
 * bearer-gated. The worker stores only the SHA-256 digest of the token — the
 * token itself lives in the operator's local receipt file and the presenter's
 * hands. A digest is safe to commit: recovering the token from it would require
 * a preimage attack. Everything else here is public-safe by design; the
 * collector URL is baked into the shipped web bundle.
 *
 * What it records (unchanged): a random per-browser session id, an optional
 * self-entered display name, route views with dwell time, tooltip opens,
 * explanation-depth changes, and notes. No IPs, no user agents, no accounts.
 */

const SUMMARY_TOKEN_SHA256 = "5627aac05750dca8bed783e0f7e4b1a9f04ddbe53f7822223a980751ca765e69";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_TEXT = 4000;
const WRITE_LIMIT_PER_MINUTE = 240;
// Per-isolate, best-effort — same posture as the node process's in-memory map.
const writeCounts = new Map();

function overWriteLimit(request) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const now = Date.now();
  const entry = writeCounts.get(ip) || { windowStart: now, count: 0 };
  if (now - entry.windowStart > 60_000) {
    entry.windowStart = now;
    entry.count = 0;
  }
  entry.count += 1;
  writeCounts.set(ip, entry);
  if (writeCounts.size > 10_000) writeCounts.clear();
  return entry.count > WRITE_LIMIT_PER_MINUTE;
}

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const clean = (value, max = 200) =>
  typeof value === "string" ? value.replace(CONTROL_CHARS, " ").trim().slice(0, max) : "";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type,authorization",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};

const send = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });

async function readBody(request) {
  const raw = await request.arrayBuffer();
  if (raw.byteLength > MAX_BODY_BYTES) throw new Error("payload too large");
  if (raw.byteLength === 0) return {};
  return JSON.parse(new TextDecoder().decode(raw));
}

async function append(kv, kind, record) {
  // Sortable-by-time keys; uuid suffix prevents same-millisecond collisions.
  const key = `${kind}:${new Date().toISOString()}:${crypto.randomUUID()}`;
  await kv.put(key, JSON.stringify(record));
}

async function readAll(kv, kind) {
  const records = [];
  let cursor;
  // Bounded pagination: 10 pages × 1000 keys per kind is far beyond beta volume.
  for (let page = 0; page < 10; page += 1) {
    const list = await kv.list({ prefix: `${kind}:`, cursor });
    const values = await Promise.all(list.keys.map((k) => kv.get(k.name)));
    for (const value of values) {
      if (!value) continue;
      try {
        records.push(JSON.parse(value));
      } catch {
        /* skip corrupt record */
      }
    }
    if (list.list_complete) break;
    cursor = list.cursor;
  }
  return records;
}

async function summaryAuthorized(request) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return false;
  const presented = header.slice("Bearer ".length);
  const digestBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(presented));
  const hex = [...new Uint8Array(digestBytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === SUMMARY_TOKEN_SHA256;
}

/** Identical aggregation to feedback-server.mjs — keep the two in step. */
function summarise(sessions, events, notes) {
  const byRoute = new Map();
  const bySession = new Map();

  for (const session of sessions) {
    bySession.set(session.sessionId, {
      sessionId: session.sessionId,
      name: session.name || "(anonymous)",
      firstSeen: session.ts,
      lastSeen: session.ts,
      routes: 0,
      dwellMs: 0,
      tooltips: 0,
      audience: session.audience || "layperson",
      notes: 0,
    });
  }

  for (const event of events) {
    const seen = bySession.get(event.sessionId);
    if (seen) seen.lastSeen = event.ts;

    if (event.type === "route_view") {
      const route = byRoute.get(event.route) || { route: event.route, views: 0, dwellMs: 0, viewers: new Set() };
      route.views += 1;
      route.dwellMs += Number(event.dwellMs) || 0;
      route.viewers.add(event.sessionId);
      byRoute.set(event.route, route);
      if (seen) {
        seen.routes += 1;
        seen.dwellMs += Number(event.dwellMs) || 0;
      }
    }
    if (event.type === "tooltip_open" && seen) seen.tooltips += 1;
    if (event.type === "audience_change" && seen) seen.audience = event.detail || seen.audience;
  }

  for (const note of notes) {
    const seen = bySession.get(note.sessionId);
    if (seen) seen.notes += 1;
  }

  const routes = [...byRoute.values()]
    .map((route) => ({
      route: route.route,
      views: route.views,
      viewers: route.viewers.size,
      totalDwellSeconds: Math.round(route.dwellMs / 1000),
      medianDwellSeconds: route.views ? Math.round(route.dwellMs / route.views / 1000) : 0,
    }))
    .sort((a, b) => b.totalDwellSeconds - a.totalDwellSeconds);

  const audiences = {};
  for (const viewer of bySession.values()) {
    audiences[viewer.audience] = (audiences[viewer.audience] || 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    viewers: [...bySession.values()].sort((a, b) => b.dwellMs - a.dwellMs),
    routes,
    audiences,
    totals: {
      viewers: bySession.size,
      routeViews: routes.reduce((sum, route) => sum + route.views, 0),
      distinctRoutes: routes.length,
      notes: notes.length,
    },
    notes: notes.slice(-200),
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const kv = env.styx_feedback;

    try {
      if (request.method === "GET" && url.pathname === "/health") return send(200, { ok: true });

      if (request.method === "POST" && overWriteLimit(request)) {
        return send(429, { error: "too many requests" });
      }

      if (request.method === "POST" && url.pathname === "/session") {
        const body = await readBody(request);
        if (!body.sessionId) return send(400, { error: "sessionId is required" });
        await append(kv, "s", {
          ts: new Date().toISOString(),
          sessionId: clean(body.sessionId, 64),
          name: clean(body.name, 80),
          audience: clean(body.audience, 32),
        });
        return send(201, { ok: true });
      }

      if (request.method === "POST" && url.pathname === "/events") {
        const body = await readBody(request);
        const events = Array.isArray(body.events) ? body.events.slice(0, 200) : [];
        const ts = new Date().toISOString();
        for (const event of events) {
          await append(kv, "e", {
            ts,
            sessionId: clean(body.sessionId, 64),
            type: clean(event.type, 32),
            route: clean(event.route, 200),
            detail: clean(event.detail, 200),
            dwellMs: Number(event.dwellMs) || 0,
          });
        }
        return send(202, { accepted: events.length });
      }

      if (request.method === "POST" && url.pathname === "/notes") {
        const body = await readBody(request);
        const text = clean(body.text, MAX_TEXT);
        if (!text) return send(400, { error: "text is required" });
        await append(kv, "n", {
          ts: new Date().toISOString(),
          sessionId: clean(body.sessionId, 64),
          name: clean(body.name, 80),
          route: clean(body.route, 200),
          text,
        });
        return send(201, { ok: true });
      }

      if (request.method === "GET" && (url.pathname === "/summary" || url.pathname === "/")) {
        if (!(await summaryAuthorized(request))) {
          return send(401, { error: "summary requires a bearer token on this host" });
        }
        const [sessions, events, notes] = await Promise.all([
          readAll(kv, "s"),
          readAll(kv, "e"),
          readAll(kv, "n"),
        ]);
        return send(200, summarise(sessions, events, notes));
      }

      return send(404, { error: "not found" });
    } catch (error) {
      return send(400, { error: error instanceof Error ? error.message : "bad request" });
    }
  },
};
