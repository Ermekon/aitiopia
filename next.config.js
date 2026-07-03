/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production'

// Content-Security-Policy
// Attacks prevented:
//   • script-src restricts which origins can load executable scripts, limiting the blast
//     radius of any XSS that gets through to only same-origin resources.
//   • connect-src blocks exfiltration: injected code cannot POST data to attacker servers.
//   • frame-ancestors 'none' prevents clickjacking — the page cannot be embedded in an
//     <iframe> on any other domain and used as an invisible click target.
//   • base-uri 'self' blocks <base href> injection, which attackers use to rewrite all
//     relative URLs to an attacker-controlled origin.
//   • form-action 'self' prevents <form action="https://attacker.com"> data exfiltration.
//
// Note: 'unsafe-inline' in script-src and style-src is required by Next.js — it injects
// inline JSON payloads for RSC hydration and may inline critical CSS. A nonce-based CSP
// via middleware would allow removing 'unsafe-inline' but is out of scope here.
const ContentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-eval' is required by Turbopack in development for source maps and
  // error overlay reconstruction. It is intentionally excluded from production.
  isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // next/font self-hosts Google Fonts at build time — no external font origin needed
  "font-src 'self'",
  // /_next/image serves optimised images from 'self'; Supabase needed for direct URLs
  "img-src 'self' data: blob: https://*.supabase.co",
  // Supabase JS client makes fetch requests to the project API
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  // Prevents browsers MIME-sniffing a response away from the declared Content-Type.
  // Attack prevented: a response served as text/plain but containing HTML/JS cannot
  // be forced to execute as a script by a legacy browser.
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Blocks the page from being embedded in a frame on any other origin (legacy browsers).
  // Modern browsers respect frame-ancestors in the CSP above; this header covers the rest.
  // Attack prevented: clickjacking — attacker overlays an invisible iframe of this site
  // over a fake UI to trick users into clicking actions they did not intend.
  { key: 'X-Frame-Options', value: 'DENY' },

  // Controls how much referrer information the browser sends on cross-origin navigations.
  // Attack prevented: URL path segments (series names, future route IDs) are not leaked
  // as Referer headers to third-party origins (Supabase CDN, analytics, etc.).
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Explicitly disables browser features this site does not use.
  // Attack prevented: if XSS executes, injected code cannot silently access the camera,
  // microphone, or geolocation even if the user previously granted those permissions.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },

  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
]

const nextConfig = {
  // Removes the X-Powered-By: Next.js header that fingerprints the framework and version,
  // making it easier for attackers to target known Next.js CVEs.
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [36, 64, 96, 128, 256, 303, 384],
  },

  async headers() {
    return [
      {
        // Apply to every route
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
