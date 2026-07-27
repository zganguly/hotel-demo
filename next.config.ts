import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for slim Docker / ECS images (copies .next/standalone + static).
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
