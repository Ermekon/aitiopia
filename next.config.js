/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // cache optimized images for 30 days — first-visit cost is paid once per device
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // tuned to actual display sizes in this gallery (avoids requesting 3840px for a 303px card)
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [36, 64, 96, 128, 256, 303, 384],
  },
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
