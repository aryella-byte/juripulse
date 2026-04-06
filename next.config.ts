import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/juripulse",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
