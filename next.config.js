/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.vusercontent.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "v0.blob.com",
        port: "",
        pathname: "/**",
      },
    ],
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.vercel.app"],
      bodySizeLimit: "2mb",
    },
  },
  // Handle bcrypt in webpack config instead
  webpack: (config, { isServer }) => {
    // Handle bcrypt for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        bcrypt: false,
      }
    }

    // For server-side, ensure bcryptjs is properly handled
    if (isServer) {
      config.externals = [...(config.externals || []), "bcryptjs"]
    }

    return config
  },
  // Production optimizations
  compress: true,
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
