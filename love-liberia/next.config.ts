import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.155.76.119", "10.151.7.119", "10.232.238.119", "localhost", "127.0.0.1"],
  turbopack: {
    root: __dirname,
  },
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 375, 414, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [64, 96, 128, 256, 384, 512, 768],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: https://images.unsplash.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
      ],
    }];
  },
};

export default nextConfig;
