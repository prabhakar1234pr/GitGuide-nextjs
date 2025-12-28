import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Compiler for automatic memoization (Next.js 16)
  // Moved from experimental.reactCompiler to root level
  reactCompiler: true,
  
  // Performance optimizations
  experimental: {
    // Optimize package imports for better tree-shaking
    optimizePackageImports: ['@clerk/nextjs'],
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Note: swcMinify is deprecated in Next.js 16 (SWC minification is enabled by default)
  // Removed swcMinify: true
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
