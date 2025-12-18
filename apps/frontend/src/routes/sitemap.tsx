import {createFileRoute} from '@tanstack/react-router';
import {generateSitemapXML} from '~/utils/sitemap';
import {getBaseUrl} from '~/config/env';
import {api} from '~/lib';

export const Route = createFileRoute('/sitemap')({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = getBaseUrl();
        const urls: Array<{
          loc: string;
          lastmod?: string;
          changefreq?: string;
          priority?: number;
        }> = [];

        // Add homepage
        urls.push({
          loc: baseUrl,
          changefreq: 'daily',
          priority: 1.0,
        });

        try {
          const eventsResponse = await api.events.getAllPaginated({
            limit: 1000,
            page: 1,
          });

          const events = eventsResponse.data.data || [];

          for (const event of events) {
            urls.push({
              loc: `${baseUrl}/eventos/${event.id}`,
              lastmod: event.updatedAt
                ? new Date(event.updatedAt).toISOString().split('T')[0]
                : undefined,
              changefreq: 'daily',
              priority: 0.8,
            });
          }
        } catch (error) {
          console.error('Error fetching events for sitemap:', error);
        }

        const xml = generateSitemapXML(urls);

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      },
    },
  },
});
