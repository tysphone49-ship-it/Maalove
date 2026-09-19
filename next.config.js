/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'output: standalone' retiré : le runtime Next de Netlify gère la cible de build.
  allowedDevOrigins: [
    '*.preview.emergentagent.com',
    '*.emergentagent.com',
    '*.emergentcf.cloud',
    '*.preview.emergentcf.cloud',
  ],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
  serverExternalPackages: ['mongodb'],
  poweredByHeader: false,
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = { poll: 2000, aggregateTimeout: 300, ignored: ['**/node_modules'] }
    }
    return config
  },
  onDemandEntries: { maxInactiveAge: 10000, pagesBufferLength: 2 },
  async headers() {
    // En-têtes de sécurité. Anti-clickjacking via SAMEORIGIN + frame-ancestors 'self'.
    // camera/microphone autorisés en self pour le selfie/vidéo (flux homme).
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self';" },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    ]
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

module.exports = nextConfig
