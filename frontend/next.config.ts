import type { NextConfig } from "next";
import path from "path"

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  reactStrictMode: false, // <--- Add this line
  webpack(config) {
    config.resolve.alias['@shared'] = path.resolve(__dirname, '../shared')
    return config
  }
};

export default nextConfig;