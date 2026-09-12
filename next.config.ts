import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

/**
 * Response headers.
 *
 * Vercel sets none of these for you, and a static site still benefits from all
 * of them. Applied to every route rather than a subset — there is no path here
 * that wants to be framed, sniffed, or handed a camera.
 *
 * Deliberately **not** a full Content-Security-Policy yet. The theme script in
 * `src/app/layout.tsx` runs inline before first paint to stop a light-mode
 * flash, so a strict `script-src` would need a nonce, and a nonce needs
 * middleware — which would put a function in front of every otherwise-static
 * route just to set a header. `frame-ancestors` is the part of CSP that works
 * without one, so that is the part that is here.
 */
const securityHeaders = [
  // Two years, and eligible for the preload list. HTTPS-only is a safe
  // commitment: Vercel does not serve this site over plain HTTP.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the origin cross-site, the full path same-site. Enough for referral
  // analytics without leaking which project page someone was reading.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // frame-ancestors is the modern form; X-Frame-Options is the fallback for
  // anything that predates CSP.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // No custom Cache-Control for /_next/static: Vercel already serves
  // content-hashed assets as immutable, and overriding it here makes Next warn
  // that it can break dev behaviour. Add it only if deploying to a host that
  // does not set it.
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The résumé viewer embeds this file in a same-origin <iframe>
      // (ResumeViewer.tsx). The blanket `frame-ancestors 'none'` above blocks
      // that framing too, so this file needs a same-origin carve-out. Next
      // applies later matches after earlier ones, overriding same-key headers
      // for the same path.
      {
        source: "/resume.pdf",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  nextConfig,
);
