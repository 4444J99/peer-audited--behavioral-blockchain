#!/usr/bin/env node
/**
 * Demo feedback collector.
 *
 * Deliberately NOT part of the product API. Rehearsal telemetry does not belong in
 * the same database as the synthetic product data: it has a different lifetime, a
 * different audience, and it must never end up in a migration or a seed. This is a
 * standalone process writing append-only NDJSON into artifacts/, which is gitignored.
 *
 * What it records: a random per-browser session id, an optional display name the
 * viewer types themselves, which routes they opened and for how long, which tooltips
 * they expanded, which explanation depth they chose, and any notes they leave.
 *
 * What it does not record: no IP addresses, no user agents, no account identity, no
 * page content. Everyone in the room is signed in as the same synthetic accounts, so
 * account identity would be noise; the self-entered name is the only attribution.
 */
import { createServer } from "node:http";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const dataDir = path.join(repoRoot, "artifacts/demo-feedback");
export const FILES = {
  sessions: path.join(dataDir, "sessions.ndjson"),
  events: path.join(dataDir, "events.ndjson"),
  notes: path.join(dataDir, "notes.ndjson"),
};

const port = Number(process.env.STYX_DEMO_FEEDBACK_PORT || 4312);
const MAX_BODY_BYTES = 64 * 1024;
const MAX_TEXT = 4000;

await mkdir(dataDir, { recursive: true });

// Strip control characters so one pasted note cannot corrupt the NDJSON line
// format that every reader downstream depends on.
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const clean = (value, max = 200) =>
  typeof value === "string" ? value.replace(CONTROL_CHARS, " ").trim().slice(0, max) : "";

async function append(file, record) {
  await appendFile(file, `${JSON.stringify(record)}\n`, "utf8");
}

export async function readNdjson(file) {
  try {
    const raw = await readFile(file, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      // A demo collector on an open LAN port should not be a memory bomb.
      if (size > MAX_BODY_BYTES) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

/** Aggregates the raw log into the shape a presenter actually wants to read. */
export function summarise(sessions, events, notes) {
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
    // The routes nobody opened are usually the more interesting half of the read.
    totals: {
      viewers: bySession.size,
      routeViews: routes.reduce((sum, route) => sum + route.views, 0),
      distinctRoutes: routes.length,
      notes: notes.length,
    },
    notes: notes.slice(-200),
  };
}

const server = createServer(async (req, res) => {
  // Wide-open CORS on purpose: this listens on a LAN port during a rehearsal and
  // every viewer arrives from a different device origin. It stores no secrets and
  // reads nothing from the product database.
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "content-type");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${port}`);
  const send = (status, payload) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(payload));
  };

  try {
    if (req.method === "GET" && url.pathname === "/health") return send(200, { ok: true });

    if (req.method === "POST" && url.pathname === "/session") {
      const body = await readBody(req);
      if (!body.sessionId) return send(400, { error: "sessionId is required" });
      await append(FILES.sessions, {
        ts: new Date().toISOString(),
        sessionId: clean(body.sessionId, 64),
        name: clean(body.name, 80),
        audience: clean(body.audience, 32),
      });
      return send(201, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/events") {
      const body = await readBody(req);
      const events = Array.isArray(body.events) ? body.events.slice(0, 200) : [];
      const ts = new Date().toISOString();
      for (const event of events) {
        await append(FILES.events, {
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

    if (req.method === "POST" && url.pathname === "/notes") {
      const body = await readBody(req);
      const text = clean(body.text, MAX_TEXT);
      if (!text) return send(400, { error: "text is required" });
      await append(FILES.notes, {
        ts: new Date().toISOString(),
        sessionId: clean(body.sessionId, 64),
        name: clean(body.name, 80),
        route: clean(body.route, 200),
        text,
      });
      return send(201, { ok: true });
    }

    if (req.method === "GET" && (url.pathname === "/summary" || url.pathname === "/")) {
      const [sessions, events, notes] = await Promise.all([
        readNdjson(FILES.sessions),
        readNdjson(FILES.events),
        readNdjson(FILES.notes),
      ]);
      return send(200, summarise(sessions, events, notes));
    }

    return send(404, { error: "not found" });
  } catch (error) {
    return send(400, { error: error instanceof Error ? error.message : "bad request" });
  }
});

// Only listen when run directly, so scripts/demo/feedback-report.mjs can import
// summarise() instead of keeping a second copy of the aggregation in step.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  // 0.0.0.0 on purpose: the viewers are on other devices. Same posture as the
  // demo web and API, which already bind every interface.
  server.listen(port, "0.0.0.0", () => {
    console.log(`✓ Demo feedback collector on 0.0.0.0:${port} → ${dataDir}`);
  });
}
