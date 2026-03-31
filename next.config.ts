import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
    transitionIndicator: false,
  },
};

export default nextConfig;
