import type { NextConfig } from "next";
import withPWA from "next-pwa";

const pwa = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

// Only use basePath and static export for production builds, not for local development
// In development mode (npm run dev), these will be disabled
// In production build (npm run build), these will be enabled for GitHub Pages
const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Only enable static export for production builds (GitHub Pages)
  // Dev server doesn't support static export
  ...(!isDev ? { output: "export" } : {}),
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
    formats: ["image/avif", "image/webp"],
  },
  // Only set basePath for production builds (GitHub Pages)
  // Leave empty for local development
  ...(!isDev ? {
    basePath: "/dr-rajeev-app",
    assetPrefix: "/dr-rajeev-app",
  } : {}),
};

export default pwa(nextConfig);
