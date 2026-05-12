import {createFileRoute} from '@tanstack/react-router';
import {getBaseUrl} from '~/config/env';
import {generateSitemapXML, xmlResponse} from '~/utils/sitemap';
import {api} from '~/lib';

export const Route = createFileRoute('/sitemap-events.xml')({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = getBaseUrl();
        const now = new Date();
        const urls = [];

        try {
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await api.events.getAllPaginated({
              limit: 1000,
              page,
            });
            const events = response.data.data || [];

            for (const event of events) {
              // Only include upcoming/active events — past events stay accessible
              // via direct URL but don't need to be in the sitemap crawl queue.
              if (event.eventEndDate && new Date(event.eventEndDate) < now) {
                continue;
              }

              urls.push({
                loc: `${baseUrl}/eventos/${event.slug}`,
                lastmod: event.updatedAt
                  ? new Date(event.updatedAt).toISOString().split('T')[0]
                  : undefined,
                changefreq: 'daily',
                priority: 0.8,
              });
            }

            hasMore = events.length === 1000;
            page++;
          }
        } catch (error) {
          console.error('sitemap-events: error fetching events', error);
        }

        return xmlResponse(generateSitemapXML(urls));
      },
    },
  },
});
