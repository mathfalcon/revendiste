import {defineNitroConfig} from 'nitro/config';

export default defineNitroConfig({
  // Use node-server preset for ECS/Docker deployment
  preset: 'node-server',

  // Set headers for HTML responses to prevent caching
  // More specific rules should be defined first
  routeRules: {
    // Cache static assets with long TTL (they're versioned by build tools)
    // These are matched first (more specific)
    '/assets/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    // Service worker must never be cached
    '/sw.js': {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Service-Worker-Allowed': '/',
      },
    },
    // Cache other static files
    '/*.{ico,png,jpg,jpeg,svg,gif,webp,woff,woff2,ttf,eot}': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    // Don't cache HTML pages - they reference versioned assets that change on each deploy
    // This is the catch-all for all other routes (HTML pages)
    '/**': {
      headers: {
        'Cache-Control': 'no-cache, must-revalidate, max-age=0',
      },
    },
  },
});
