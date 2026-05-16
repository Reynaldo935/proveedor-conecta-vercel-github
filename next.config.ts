import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-209caf1c-61ef-4935-aa21-0ed59ca5f08a.space-z.ai",
    ".space-z.ai",
    ".chatglm.cn",
    "z.ai",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
