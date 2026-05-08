/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',   // Required for Docker/Cloud Run deployment
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('canvas')
    }
    return config
  },
}

module.exports = nextConfig