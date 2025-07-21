import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove output: 'export' for development
  // output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  reactStrictMode: false, // <--- Add this line

};

export default nextConfig;