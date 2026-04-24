import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Project root (folder that contains this file). Pinning this fixes Turbopack picking a parent directory when multiple lockfiles exist (e.g. under the user home folder). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  images: {
    // This disables Vercel's expensive Edge Image Optimization
    // Images will load instantly as normal static files
    unoptimized: true,
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;