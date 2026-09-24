import type { NextConfig } from "next";

const localArtifactExclusions = [
  "./.pnpm-store/**/*",
  "./.npm-cache/**/*",
  "./.local-data/**/*",
  "./.git/**/*",
  "./playwright-report/**/*",
  "./test-results/**/*",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Local receipt storage uses a runtime file path during development. Without
  // explicit exclusions, Node File Trace can conservatively include the whole
  // project and Vercel may try to package pnpm's transient SQLite sidecar files.
  // Production receipts are stored remotely, so none of these local/build
  // artifacts belong in a serverless function bundle.
  outputFileTracingExcludes: {
    "/*": localArtifactExclusions,
    "/api/telegram/*": localArtifactExclusions,
    "/api/admin/orders/*": localArtifactExclusions,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
