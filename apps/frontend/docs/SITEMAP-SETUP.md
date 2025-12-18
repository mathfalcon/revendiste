# Sitemap Setup Guide

This project uses **TanStack Router server routes** to generate sitemaps dynamically at runtime.

## How It Works

The sitemap is generated **at runtime** using a server route, which means:

- ✅ **Simple**: No build-time complexity or env var issues
- ✅ **Dynamic**: Always up-to-date with current events
- ✅ **Flexible**: Easy to add new routes or modify logic
- ✅ **Reliable**: Works regardless of build configuration

## Implementation

The sitemap is implemented as a server route at `/sitemap`:

- **Route file**: `src/routes/sitemap.xml.tsx`
- **Utility functions**: `src/utils/sitemap.ts`
- **Server handler**: Fetches events from API and generates XML

## How It Works

1. When a request comes to `/sitemap`, the server route handler runs
2. It fetches all events from your API
3. It generates XML using the `generateSitemapXML` utility
4. Returns the XML with proper headers and caching

## Adding Routes

To add routes to the sitemap, edit `src/routes/sitemap.xml.tsx`:

```typescript
// Add static routes
urls.push({
  loc: `${baseUrl}/about`,
  changefreq: 'monthly',
  priority: 0.8,
});

// Add dynamic routes from your data source
const items = await fetchItems();
for (const item of items) {
  urls.push({
    loc: `${baseUrl}/items/${item.id}`,
    lastmod: item.updatedAt
      ? new Date(item.updatedAt).toISOString().split('T')[0]
      : undefined,
    changefreq: 'weekly',
    priority: 0.7,
  });
}
```

## Current Implementation

The sitemap currently includes:

- **Homepage** (`/`) - Priority 1.0, daily updates
- **All events** (`/eventos/$eventId`) - Priority 0.8, weekly updates, includes last modified dates

## Testing

To test the sitemap:

```bash
# Start your dev server
pnpm dev

# Visit the sitemap
curl http://localhost:3000/sitemap

# Or open in browser
open http://localhost:3000/sitemap
```

## Caching

The sitemap is cached for 1 hour (`max-age=3600`) to reduce server load. You can adjust this in the route handler:

```typescript
headers: {
  'Cache-Control': 'public, max-age=3600', // 1 hour
}
```

## Production

In production, the sitemap will be available at:
- `https://revendiste.com/sitemap`

Make sure to:
1. Submit the sitemap URL to Google Search Console
2. Verify it's accessible and returns valid XML
3. Check that all important pages are included

## Resources

- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [Google Search Console](https://search.google.com/search-console)
- [TanStack Router Server Routes](https://tanstack.com/router/latest/docs/framework/react/guide/server-routes)

