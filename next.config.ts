import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["bcryptjs", "sharp"],
  // Dev origins only used locally; harmless in production
  allowedDevOrigins: [
    "preview-chat-209caf1c-61ef-4935-aa21-0ed59ca5f08a.space-z.ai",
    ".space-z.ai",
    ".chatglm.cn",
    "z.ai",
    "localhost",
    "127.0.0.1",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "**.vercel.app",
      },
    ],
  },
};

export default nextConfig;
