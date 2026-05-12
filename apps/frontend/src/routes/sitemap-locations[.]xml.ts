import {createFileRoute} from '@tanstack/react-router';
import {getBaseUrl} from '~/config/env';
import {generateSitemapXML, xmlResponse} from '~/utils/sitemap';
import {api} from '~/lib';
import {regionToSlug} from '~/utils/location-slugs';

export const Route = createFileRoute('/sitemap-locations.xml')({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = getBaseUrl();
        const urls = [
          {loc: `${baseUrl}/eventos/hoy`, changefreq: 'daily', priority: 0.7},
          {
            loc: `${baseUrl}/eventos/este-fin-de-semana`,
            changefreq: 'daily',
            priority: 0.7,
          },
        ];

        try {
          const regionsResponse = await api.events.getDistinctRegions();
          for (const group of regionsResponse.data) {
            for (const region of group.regions) {
              urls.push({
                loc: `${baseUrl}/eventos/en/${regionToSlug(region)}`,
                changefreq: 'daily',
                priority: 0.7,
              });
            }
          }
        } catch (error) {
          console.error('sitemap-locations: error fetching regions', error);
        }

        return xmlResponse(generateSitemapXML(urls));
      },
    },
  },
});
