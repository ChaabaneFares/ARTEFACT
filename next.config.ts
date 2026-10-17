import type { NextConfig } from "next";
import { buildLocaleRedirects, buildLocaleRewrites } from "./src/i18n/routing";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.105"],
  images: {
    localPatterns: [
      { pathname: "/**", search: "" },
      { pathname: "/assets/**", search: "?brand=artefact-20261012" },
    ],
    // The echo-view frames are immutable art assets routed through the
    // optimizer. A long TTL means each frame is encoded once rather than
    // re-encoded every 31 days, so the on-demand encode cost is paid once.
    minimumCacheTTL: 31536000,
  },
  experimental: {
    // The root layout lives under `[locale]`, so a URL that matches no
    // language needs its own complete document.
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        // Font files are versioned by name, so they never change in place.
        source: "/assets/fonts/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  // Language routing is static configuration, not middleware: the CDN applies
  // it before the cache, and no function runs on the request path.
  async redirects() {
    return buildLocaleRedirects();
  },
  async rewrites() {
    return { beforeFiles: buildLocaleRewrites(), afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
