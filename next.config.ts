import type { NextConfig } from "next";

export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), geolocation=(), microphone=(self), payment=(), usb=(), browsing-topics=()",
  },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // A smoke server must never share the interactive dev server's lock/cache.
  distDir: process.env.HANGO_SMOKE_TEST === "1" ? ".next-smoke" : ".next",
  // Dev-only. Without this, `next dev` returns 403 for its own JS chunks to
  // any origin that isn't localhost, so a phone on the LAN loads the
  // server-rendered HTML but never hydrates - the page looks right and
  // nothing responds to taps. Has no effect on production builds.
  allowedDevOrigins: ["192.168.0.*", "10.0.0.*", "172.16.0.*"],
  experimental: {
    // Speaking Lab accepts recordings up to 15 MiB. Next counts the complete
    // multipart request, so keep a small allowance for its field metadata;
    // the action still performs the strict content-aware 15 MiB check.
    serverActions: { bodySizeLimit: "16mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
