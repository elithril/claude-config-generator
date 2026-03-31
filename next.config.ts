import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
    transitionIndicator: true,
  },
};

export default nextConfig;
