/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/editpdf',
  assetPrefix: '/editpdf/',
}

module.exports = nextConfig
