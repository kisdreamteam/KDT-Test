import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // This disables Vercel's expensive Edge Image Optimization
    // Images will load instantly as normal static files
    unoptimized: true,
  },
};

export default nextConfig;