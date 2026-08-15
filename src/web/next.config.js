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
