const path = require("path");
const repoRoot = path.resolve(__dirname, "../..");

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function getApiUrl() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.STYX_API_PUBLIC_URL;
  return apiUrl ? normalizeBaseUrl(apiUrl) : null;
}

// The Cloudflare snapshot build is a fully static export of the demo running against
// captured synthetic fixtures: no API, no database, no Redis. It exists so people who
// are NOT in the room can open the guided tour. Everything conditioned on it below is
// conditional because static export forbids a server: no rewrites, no image optimizer.
const SNAPSHOT = process.env.NEXT_PUBLIC_STYX_SNAPSHOT === "true";

// The p5 sketches in the pitch deck fetch a typeface from this CDN at runtime
// (components/PitchDeck/ui/slides/p5Sketches.ts). It is the only third-party
// origin the browser is allowed to reach.
const FONT_CDN = "https://cdnjs.cloudflare.com";

/**
 * Content-Security-Policy for the app.
 *
 * script-src carries 'unsafe-inline' because Next hydrates through inline
 * <script> tags (self.__next_f.push(...)) that carry no nonce. Nonces would have
 * to be minted per request in proxy.ts and threaded into the document — and the
 * snapshot build (output:"export") has no request at all, so the same policy
 * could not hold on both build paths. 'unsafe-inline' is therefore a property of
 * the framework here, not an oversight; tightening it is a nonce/middleware
 * project, not a header edit.
 *
 * style-src is the same story for Tailwind's injected critical CSS plus the
 * inline <style> block in components/PitchDeck/PitchDeck.tsx.
 *
 * img-src / media-src allow any https origin because Fury review renders proof
 * media from Cloudflare R2 presigned URLs (fury.controller.ts -> generateViewUrl),
 * whose host is deploy-time configuration. Narrowing these to 'self' would blank
 * the reviewer's evidence pane.
 *
 * No Strict-Transport-Security here: max-age is not revocable by a later deploy,
 * and the web host is env-driven (WEB_URL). HSTS belongs on the edge that owns
 * the domain, once a domain is actually pinned.
 */
function buildContentSecurityPolicy(isDev) {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    // Dev needs 'unsafe-eval' for the bundler's eval-based source maps.
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    `font-src 'self' data: ${FONT_CDN}`,
    // Dev needs the websocket origins for hot reload.
    `connect-src 'self' ${FONT_CDN}${isDev ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];
  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }
  return directives.join("; ");
}

function securityHeaders(isDev) {
  return [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(isDev),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Redundant with frame-ancestors for modern browsers, kept for the ones that
    // only honour the legacy header.
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
  ];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
  ...(SNAPSHOT
    ? {
        output: "export",
        images: { unoptimized: true },
        // Cloudflare Pages resolves /route/ to /route/index.html.
        trailingSlash: true,
      }
    : {}),
  // The Docker image's runner stage copies .next/standalone and runs
  // src/web/server.js — output that only exists when Next builds in
  // standalone mode. Gated on the env the Dockerfile sets (same pattern as
  // SNAPSHOT above) so the Render path (`next start`) and the snapshot
  // export keep their existing build shapes. Issue #890: the Dockerfile
  // assumed standalone output that no config ever produced.
  ...(!SNAPSHOT && process.env.STYX_DOCKER_BUILD === "true"
    ? { output: "standalone" }
    : {}),
  async headers() {
    // Next ignores headers() under output:"export" — there is no server to emit
    // them — so returning [] in snapshot mode keeps the export honest instead of
    // advertising a policy that nothing enforces. The snapshot's headers belong
    // to whatever serves out/ (a Cloudflare Pages _headers file).
    if (SNAPSHOT) return [];
    return [
      {
        source: "/:path*",
        headers: securityHeaders(process.env.NODE_ENV !== "production"),
      },
    ];
  },
  async rewrites() {
    // Static export has no proxy layer. In snapshot mode the client answers from
    // bundled fixtures and never calls /api at all.
    if (SNAPSHOT) return [];
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      // Fallback rewrite so the image always contains the API
      // route rule. Runtime env (when set) will replace it via
      // the deployment platform's runtime config. This keeps the
      // Docker image functional when built without a public URL.
      // The destination service name matches the docker-compose
      // service in .config/docker/docker-compose.yml ("styx-api");
      // the container port is the canonical API port (3000).
      return [
        {
          source: "/api/:path*",
          destination: `http://styx-api:3000/:path*`,
        },
      ];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
