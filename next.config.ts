import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev https://*.convex.dev https://convex.dev https://*.convex.cloud https://js.stripe.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-src 'self' https://js.stripe.com https://*.stripe.com; connect-src 'self' https://*.clerk.accounts.dev https://*.convex.dev https://convex.dev https://*.convex.cloud wss://*.convex.dev wss://*.convex.cloud https://clerk-telemetry.com https://api.stripe.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
