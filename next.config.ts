import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/sunum",
        destination: "/sunum/index.html",
      },
      {
        source: "/sunum/",
        destination: "/sunum/index.html",
      },
      {
        source: "/sunum-global",
        destination: "/sunum/global-analiz.html",
      },
      {
        source: "/sunum-global/",
        destination: "/sunum/global-analiz.html",
      },
      {
        source: "/sunum-yatirim",
        destination: "/sunum/yatirim-cihazlar.html",
      },
      {
        source: "/sunum-yatirim/",
        destination: "/sunum/yatirim-cihazlar.html",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/:manifest(manifest.*\\.webmanifest)",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
