import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  // Short referral links. Temporary (307) so the mobile app can claim /r/* with App Links later.
  redirects: async () => [
    { source: "/r/:code([A-Za-z0-9]{4,16})", destination: "/dashboard/signup?ref=:code", permanent: false },
  ],
  // Same-origin API calls: no CORS, and the server's SameSite=Strict refresh cookie lands on this site.
  rewrites: async () =>
    process.env.API_PROXY_TARGET
      ? [{ source: "/api/v1/:path*", destination: `${process.env.API_PROXY_TARGET}/api/v1/:path*` }]
      : [],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
