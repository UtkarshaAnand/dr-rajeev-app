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
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
    formats: ["image/avif", "image/webp"],
  },
  basePath: "/dr-rajeev-app",
  assetPrefix: "/dr-rajeev-app",
  // IMPORTANT: If your site URL is https://username.github.io/repo-name (NOT username.github.io)
  // Uncomment the next 2 lines and replace "repo-name" with your actual repository name:
  // basePath: "/repo-name",
  // assetPrefix: "/repo-name",
};

export default pwa(nextConfig);
