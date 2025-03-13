module.exports = {
  globDirectory: 'build/',
  globPatterns: [
    '**/*.{js,css,html,png,jpg,jpeg,gif,svg,ico,json}',
    'manifest.json',
    'service-worker.js'
  ],
  swDest: 'build/service-worker.js',
  swSrc: 'public/service-worker.js',
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.supabase\.co/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    }
  ],
  skipWaiting: true,
  clientsClaim: true
}; 