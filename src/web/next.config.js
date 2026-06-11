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

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
  async rewrites() {
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
