import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Demo build: skip the image optimizer so any remote/data-URL image works
  // without remotePatterns config.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
