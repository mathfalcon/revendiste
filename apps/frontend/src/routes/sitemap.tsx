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

        // Add static pages
        urls.push(
          {loc: `${baseUrl}/preguntas-frecuentes`, changefreq: 'monthly', priority: 0.6},
          {loc: `${baseUrl}/contacto`, changefreq: 'monthly', priority: 0.5},
          {loc: `${baseUrl}/garantia`, changefreq: 'monthly', priority: 0.5},
          {loc: `${baseUrl}/terminos-y-condiciones`, changefreq: 'yearly', priority: 0.3},
          {loc: `${baseUrl}/politica-de-privacidad`, changefreq: 'yearly', priority: 0.3},
        );

        try {
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const eventsResponse = await api.events.getAllPaginated({
              limit: 1000,
              page,
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

            hasMore = events.length === 1000;
            page++;
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
