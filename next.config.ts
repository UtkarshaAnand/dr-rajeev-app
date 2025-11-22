import type { NextConfig } from "next";
import withPWA from "next-pwa";

const pwa = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "export",
  trailingSlash: true, // Helps with GitHub Pages routing
  images: {
    unoptimized: true, // Required for static export
    formats: ["image/avif", "image/webp"],
  },
  // If your repo is not at root (e.g., username.github.io/repo-name), uncomment and set basePath:
  // basePath: "/repo-name",
  // assetPrefix: "/repo-name", // Also set this if using basePath
};

export default pwa(nextConfig);
