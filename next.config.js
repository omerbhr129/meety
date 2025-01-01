/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['framer-motion'],
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  experimental: {
    forceSwcTransforms: true
  },
  // Disable Vercel's default features
  images: {
    loader: 'default',
    unoptimized: true
  },
  // Disable build indicators
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: false
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: ['next/babel'],
            plugins: [
              ['@babel/plugin-transform-runtime', {
                regenerator: true
              }]
            ]
          }
        }
      ]
    });
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://meetyil.com/api/:path*'  // בסביבת ייצור נשתמש בדומיין האמיתי
          : 'http://localhost:5004/:path*'  // בסביבת פיתוח נשתמש בשרת המקומי
      }
    ]
  },
  // הוספת דפים ציבוריים שלא דורשים התחברות
  publicRuntimeConfig: {
    publicPaths: ['/book', '/book/[typeId]']
  }
}
