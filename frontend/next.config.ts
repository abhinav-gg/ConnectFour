import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
};

export default nextConfig;

module.exports = {
  images: {
    unoptimized: true,
  },
};