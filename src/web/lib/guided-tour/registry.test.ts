import { readdirSync, statSync } from "node:fs";
import path from "node:path";

import {
  CHAPTERS,
  PERSONA_ACCOUNTS,
  TOUR_ORDER,
  TOUR_ROUTES,
  matchTourRoute,
} from "./registry";

const APP_DIR = path.resolve(__dirname, "../../app");

/** Every route in the app, as the guided tour would see it in the address bar. */
function discoverAppRoutes(dir: string = APP_DIR, prefix = ""): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      // Route groups and private folders do not appear in the URL.
      if (entry.startsWith("_")) continue;
      const segment = entry.startsWith("(") && entry.endsWith(")") ? "" : `/${decodeURIComponent(entry)}`;
      found.push(...discoverAppRoutes(full, `${prefix}${segment}`));
    } else if (entry === "page.tsx") {
      found.push(prefix === "" ? "/" : prefix);
    }
  }
  return found;
}

describe("guided tour registry", () => {
  const appRoutes = discoverAppRoutes().sort();

  // The point of the tour is that a viewer can open any route and be told what
  // it is. A route with no entry is a silent hole in that promise, so failing
  // here is the intended behaviour when someone adds a page.
  it("explains every route in the app", () => {
    const registered = new Set(TOUR_ROUTES.map((route) => route.path));
    const missing = appRoutes.filter((route) => !registered.has(route));
    expect(missing).toEqual([]);
  });

  it("has no entry for a route that no longer exists", () => {
    const actual = new Set(appRoutes);
    const stale = TOUR_ROUTES.map((route) => route.path).filter((route) => !actual.has(route));
    expect(stale).toEqual([]);
  });

  it("gives every route real copy, not a placeholder", () => {
    for (const route of TOUR_ROUTES) {
      expect(route.title.trim().length).toBeGreaterThan(0);
      // Short enough to be a stub is a real failure mode for a registry this
      // wide: a one-word summary reads as covered while explaining nothing.
      expect(route.summary.trim().length).toBeGreaterThan(30);
      expect(route.detail.trim().length).toBeGreaterThan(30);
      expect(CHAPTERS).toContain(route.chapter);
    }
  });

  it("names a known synthetic account whenever a persona is required", () => {
    for (const route of TOUR_ROUTES) {
      if (route.persona === "none") continue;
      expect(PERSONA_ACCOUNTS[route.persona]).toMatch(/@/);
    }
  });

  it("orders every route exactly once", () => {
    expect(TOUR_ORDER).toHaveLength(TOUR_ROUTES.length);
    expect(new Set(TOUR_ORDER.map((route) => route.path)).size).toBe(TOUR_ROUTES.length);
  });

  it("matches dynamic routes to their registry entry", () => {
    expect(matchTourRoute("/contracts/abc123")?.path).toBe("/contracts/[id]");
    expect(matchTourRoute("/contracts/abc123/attest")?.path).toBe("/contracts/[id]/attest");
    expect(matchTourRoute("/realms/fitness")?.path).toBe("/realms/[slug]");
    expect(matchTourRoute("/dashboard")?.path).toBe("/dashboard");
    expect(matchTourRoute("/not-a-real-route")).toBeUndefined();
  });

  // The Cloudflare snapshot builds with trailingSlash, so every pathname arrives with
  // one. Without normalisation the tour disappears entirely on the hosted build.
  it("matches paths that arrive with a trailing slash", () => {
    expect(matchTourRoute("/dashboard/")?.path).toBe("/dashboard");
    expect(matchTourRoute("/tour/")?.path).toBe("/tour");
    expect(matchTourRoute("/realms/fitness/")?.path).toBe("/realms/[slug]");
    expect(matchTourRoute("/")?.path).toBe("/");
  });
});
