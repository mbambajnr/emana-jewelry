import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "smeepqtjbsoztrcqgqes.supabase.co",
      },
    ],
  },
};

export default nextConfig;
