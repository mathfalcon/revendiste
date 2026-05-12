import {createFileRoute} from '@tanstack/react-router';
import {getBaseUrl} from '~/config/env';
import {generateSitemapIndexXML, xmlResponse} from '~/utils/sitemap';

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = getBaseUrl();
        const today = new Date().toISOString().split('T')[0];

        const xml = generateSitemapIndexXML([
          {loc: `${baseUrl}/sitemap-static.xml`},
          {loc: `${baseUrl}/sitemap-locations.xml`, lastmod: today},
          {loc: `${baseUrl}/sitemap-events.xml`, lastmod: today},
        ]);

        return xmlResponse(xml);
      },
    },
  },
});
