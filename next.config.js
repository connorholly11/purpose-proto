/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@pinecone-database/pinecone'],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error
      config.resolve.fallback = {
        fs: false,
        path: false,
      };
    }
    return config;
  },
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 