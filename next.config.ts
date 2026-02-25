import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/editpdf',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
