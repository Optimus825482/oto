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
    ];
  },
};

export default nextConfig;
