const path = require('path');

console.log('[DEBUG] Loading next.config.js');

const sharedPath = path.resolve(__dirname, '../shared');
console.log('[DEBUG] Shared alias resolved to:', sharedPath);

const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,

  experimental: {
    externalDir: true,
  },

  webpack(config) {
    console.log('[DEBUG] Webpack config modified with @shared alias');
    config.resolve.alias['@shared'] = sharedPath;
    return config;
  },

};

module.exports = nextConfig;
