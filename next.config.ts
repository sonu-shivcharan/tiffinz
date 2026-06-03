import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://ik.imagekit.io/**"),
      new URL("https://example.com/**"),
    ],
  },

  allowedDevOrigins: ["192.168.1.2"],
};

export default nextConfig;
