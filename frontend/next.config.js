const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,

  experimental: {
    externalDir: true, // 👈 allows importing from outside the Next.js root (e.g. ../shared)
  },

  webpack(config) {
    config.resolve.alias['@shared'] = path.resolve(__dirname, '../shared');
    return config;
  },
};

module.exports = nextConfig;
