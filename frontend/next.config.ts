import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove output: 'export' for development
  // output: 'export',
  // distDir: 'out',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;