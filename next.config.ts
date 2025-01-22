/** @type {import('next').NextConfig} */
const nextConfig = {
  // This ensures proper handling of static assets
  output: 'standalone',
  
  // Optimize image handling
  images: {
    unoptimized: false,
    // Add any domains you're loading images from
    domains: [],
  },
  
  // Enable edge runtime for better performance
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb' // Adjust as needed
    }
  }
};

module.exports = nextConfig;