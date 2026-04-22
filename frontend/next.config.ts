// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
