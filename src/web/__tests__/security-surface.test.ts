import * as fs from "fs";
import * as path from "path";

// The env has to stay applied across the whole callback, not just the require:
// SNAPSHOT is read when next.config.js is loaded, but NODE_ENV and
// NEXT_PUBLIC_API_URL are read inside headers()/rewrites() when they are called.
async function withConfig<T>(
  env: Record<string, string | undefined>,
  use: (config: any) => Promise<T> | T,
): Promise<T> {
  jest.resetModules();
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    // next.config.js is CommonJS and lives outside the tsc program's include
    // globs, so it is pulled in with require() rather than an import.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return await use(require("../next.config.js"));
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function headersFor(env: Record<string, string | undefined>): Promise<any> {
  return withConfig(env, (config) => config.headers());
}

function directives(csp: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of csp.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const space = trimmed.indexOf(" ");
    if (space === -1) {
      map.set(trimmed, "");
    } else {
      map.set(trimmed.slice(0, space), trimmed.slice(space + 1));
    }
  }
  return map;
}

describe("next.config security headers", () => {
  it("applies the header set to every path in a server build", async () => {
    const rules = await headersFor({
      NEXT_PUBLIC_STYX_SNAPSHOT: undefined,
      NODE_ENV: "production",
    });

    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/:path*");

    const keys = rules[0].headers.map((h: { key: string }) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "X-Frame-Options",
        "Permissions-Policy",
      ]),
    );
  });

  it("locks down the framing, object, and base-uri directives", async () => {
    const rules = await headersFor({
      NEXT_PUBLIC_STYX_SNAPSHOT: undefined,
      NODE_ENV: "production",
    });
    const csp = directives(
      rules[0].headers.find(
        (h: { key: string }) => h.key === "Content-Security-Policy",
      ).value,
    );

    expect(csp.get("default-src")).toBe("'self'");
    expect(csp.get("frame-ancestors")).toBe("'none'");
    expect(csp.get("object-src")).toBe("'none'");
    expect(csp.get("base-uri")).toBe("'self'");
    expect(csp.get("form-action")).toBe("'self'");
  });

  it("never ships 'unsafe-eval' in a production build", async () => {
    const rules = await headersFor({
      NEXT_PUBLIC_STYX_SNAPSHOT: undefined,
      NODE_ENV: "production",
    });
    const csp = directives(
      rules[0].headers.find(
        (h: { key: string }) => h.key === "Content-Security-Policy",
      ).value,
    );

    expect(csp.get("script-src")).toBe("'self' 'unsafe-inline'");
    expect(csp.has("upgrade-insecure-requests")).toBe(true);
  });

  it("allows the bundler's eval source maps and HMR sockets in dev only", async () => {
    const rules = await headersFor({
      NEXT_PUBLIC_STYX_SNAPSHOT: undefined,
      NODE_ENV: "development",
    });
    const csp = directives(
      rules[0].headers.find(
        (h: { key: string }) => h.key === "Content-Security-Policy",
      ).value,
    );

    expect(csp.get("script-src")).toContain("'unsafe-eval'");
    expect(csp.get("connect-src")).toContain("ws:");
    // upgrade-insecure-requests would break http://localhost.
    expect(csp.has("upgrade-insecure-requests")).toBe(false);
  });

  it("keeps the proof-media origins reachable for Fury review", async () => {
    const rules = await headersFor({
      NEXT_PUBLIC_STYX_SNAPSHOT: undefined,
      NODE_ENV: "production",
    });
    const csp = directives(
      rules[0].headers.find(
        (h: { key: string }) => h.key === "Content-Security-Policy",
      ).value,
    );

    // R2 presigned URLs live on a deploy-time host; blanking these blanks the
    // reviewer's evidence pane.
    expect(csp.get("img-src")).toContain("https:");
    expect(csp.get("media-src")).toContain("https:");
    expect(csp.get("font-src")).toContain("https://cdnjs.cloudflare.com");
  });

  it("emits no headers under the static snapshot export", async () => {
    const rules = await headersFor({
      NEXT_PUBLIC_STYX_SNAPSHOT: "true",
      NODE_ENV: "production",
    });
    expect(rules).toEqual([]);
  });

  it("still evaluates rewrites on both build paths", async () => {
    await withConfig(
      { NEXT_PUBLIC_STYX_SNAPSHOT: "true", NODE_ENV: "production" },
      async (snapshot) => {
        expect(snapshot.output).toBe("export");
        await expect(snapshot.rewrites()).resolves.toEqual([]);
      },
    );

    await withConfig(
      {
        NEXT_PUBLIC_STYX_SNAPSHOT: undefined,
        NEXT_PUBLIC_API_URL: "https://api.example.com/",
        STYX_API_PUBLIC_URL: undefined,
        NODE_ENV: "production",
      },
      async (server) => {
        expect(server.output).toBeUndefined();
        await expect(server.rewrites()).resolves.toEqual([
          {
            source: "/api/:path*",
            destination: "https://api.example.com/:path*",
          },
        ]);
      },
    );
  });
});

describe(".well-known/security.txt", () => {
  const file = path.join(
    __dirname,
    "..",
    "public",
    ".well-known",
    "security.txt",
  );

  function fields(): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (!line.trim() || line.trimStart().startsWith("#")) continue;
      const colon = line.indexOf(":");
      const name = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim();
      map.set(name, [...(map.get(name) || []), value]);
    }
    return map;
  }

  it("carries every field RFC 9116 requires plus the optional Policy pointer", () => {
    const parsed = fields();
    expect(parsed.get("Contact")).toHaveLength(1);
    expect(parsed.get("Expires")).toHaveLength(1);
    expect(parsed.get("Preferred-Languages")).toEqual(["en"]);
    expect(parsed.get("Canonical")).toHaveLength(1);
    expect(parsed.get("Policy")).toHaveLength(1);
  });

  it("has not expired and stays inside the one-year recommendation", () => {
    const expires = new Date(fields().get("Expires")![0]);
    expect(Number.isNaN(expires.getTime())).toBe(false);

    const now = Date.now();
    expect(expires.getTime()).toBeGreaterThan(now);
    // RFC 9116 §2.5.5: less than a year out, so a stale file is visibly stale.
    expect(expires.getTime()).toBeLessThan(now + 366 * 24 * 60 * 60 * 1000);
  });

  it("points every URI at https", () => {
    const parsed = fields();
    for (const name of ["Contact", "Canonical", "Policy"]) {
      for (const value of parsed.get(name)!) {
        expect(value.startsWith("https://")).toBe(true);
      }
    }
  });
});
