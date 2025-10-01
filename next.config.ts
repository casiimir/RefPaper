const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.refpaper.xyz https://challenges.cloudflare.com https://js.stripe.com;
  connect-src 'self' https://clerk.refpaper.xyz https://*.convex.dev https://convex.dev https://*.convex.cloud wss://*.convex.dev wss://*.convex.cloud https://clerk-telemetry.com https://api.stripe.com;;
  img-src 'self' https://img.clerk.com https://*.google.com https://*.gstatic.com;
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline';
  frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://*.stripe.com https://app.supademo.com;
  form-action 'self';
`;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
