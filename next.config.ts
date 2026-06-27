import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SITE_URL: "https://delta-escort.865111370.workers.dev",
    NEXT_PUBLIC_SUPABASE_URL: "https://tiqxfakxkrjztbalqlgh.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_nqtq10yoRVHLu-MyF3f6mg_AcxIswgq",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
