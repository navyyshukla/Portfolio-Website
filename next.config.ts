import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // No custom Cache-Control for /_next/static: Vercel already serves
  // content-hashed assets as immutable, and overriding it here makes Next warn
  // that it can break dev behaviour. Add it only if deploying to a host that
  // does not set it.
};

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  nextConfig,
);
