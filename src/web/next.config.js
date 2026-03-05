const path = require('path');
const repoRoot = path.join(__dirname, '../../');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
