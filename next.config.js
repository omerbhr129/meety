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
          ? '/api/:path*'  // בסביבת ייצור נשתמש בנתיב יחסי
          : 'http://localhost:5004/:path*'  // בסביבת פיתוח נשתמש בשרת המקומי
      }
    ]
  }
}

module.exports = nextConfig;
