/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'react-native-sqlite-storage': false,
      '@sap/hana-client': false,
      'mysql': false,
      'mysql2': false,
      'oracledb': false,
      'pg-query-stream': false,
      'sql.js': false,
      'sqlite3': false,
      'tedious': false,
    };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['typeorm', 'pg'],
  },
};

module.exports = nextConfig;
