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
    if (!apiUrl) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
