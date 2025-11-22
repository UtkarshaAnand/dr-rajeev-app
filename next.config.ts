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
  images: {
    unoptimized: true, // Required for static export
    formats: ["image/avif", "image/webp"],
  },
  // If your repo is not at root (e.g., username.github.io/repo-name), uncomment and set basePath:
  // basePath: "/repo-name",
  // trailingSlash: true,
};

export default pwa(nextConfig);
