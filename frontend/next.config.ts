// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint during build
  },
  output: "standalone", // Better for production deployment
  // Proxy API calls tới backend Ktor — tránh CORS khi dev
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/:path*",
      },
    ];
  },
};

export default nextConfig;
