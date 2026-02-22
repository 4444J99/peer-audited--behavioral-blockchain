/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Other experimental features if any
  },
  // Try turbopack at the root level as per some Next.js 15+ docs
  // though the error message specifically said 'set turbopack.root'
  // Let's try placing it at the root.
  turbopack: {
    root: '../../',
  },
};

module.exports = nextConfig;
