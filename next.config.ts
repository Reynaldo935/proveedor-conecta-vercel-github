import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force fresh build on every deploy — invalidates Vercel cache
  generateBuildId: async () => `pc-build-${Date.now()}`,

  // ─── CDN & Performance ────────────────────────────────────────────────────
  // Vercel Edge Network serves static assets globally
  // Cloudflare CDN can be added by pointing DNS to Vercel or using Cloudflare proxy
  reactStrictMode: false,
  serverExternalPackages: ["bcryptjs", "sharp", "pusher", "nodemailer"],

  // Compress responses (Vercel handles this at edge)
  compress: true,

  // Cache-Control for static assets (1 year for immutable hashed assets)
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/api/upload/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, s-maxage=86400" },
        ],
      },
      {
        source: "/uploads/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, s-maxage=604800" },
        ],
      },
    ]
  },

  allowedDevOrigins: [
    "preview-chat-209caf1c-61ef-4935-aa21-0ed59ca5f08a.space-z.ai",
    ".space-z.ai",
    ".chatglm.cn",
    "z.ai",
    "localhost",
    "127.0.0.1",
  ],

  images: {
    // Vercel's built-in Image Optimization (edge caching)
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24 hours cache for optimized images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "**.vercel.app",
      },
      {
        protocol: "https",
        hostname: "api.open-meteo.com",
      },
      {
        protocol: "https",
        hostname: "**.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "fakestoreapi.com",
      },
      {
        protocol: "https",
        hostname: "**.github.io",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
    ],
  },
};

export default nextConfig;
