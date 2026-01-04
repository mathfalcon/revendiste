import {defineNitroConfig} from 'nitro/config';

export default defineNitroConfig({
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
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
  },
});
