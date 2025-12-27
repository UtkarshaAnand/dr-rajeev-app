import type { NextConfig } from "next";
import withPWA from "next-pwa";

const pwa = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

// Determine deployment target
// Set DEPLOYMENT_TARGET=static for static export (GitHub Pages)
// Omit or set to 'server' for Node.js server (Render, Vercel, etc.)
const deploymentTarget = process.env.DEPLOYMENT_TARGET || 'server';
const isStaticExport = deploymentTarget === 'static';
const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Only enable static export if explicitly set
  // Render and other Node.js platforms need server mode
  ...(isStaticExport ? { output: "export" } : {}),
  trailingSlash: true,
  images: {
    // Only unoptimized for static export
    ...(isStaticExport ? { unoptimized: true } : {}),
    formats: ["image/avif", "image/webp"],
  },
  // Only set basePath for static export (GitHub Pages)
  // Render doesn't need basePath
  ...(isStaticExport && !isDev ? {
    basePath: "/dr-rajeev-app",
    assetPrefix: "/dr-rajeev-app",
  } : {}),
};

export default pwa(nextConfig);
