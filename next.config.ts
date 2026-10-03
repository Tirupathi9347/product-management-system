import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.loca.lt",
    "**.loca.lt",
    "*.lhr.life",
    "**.lhr.life",
    "*.ngrok-free.app",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
