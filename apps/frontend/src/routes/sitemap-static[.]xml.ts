import {createFileRoute} from '@tanstack/react-router';
import {getBaseUrl} from '~/config/env';
import {generateSitemapXML, xmlResponse} from '~/utils/sitemap';

export const Route = createFileRoute('/sitemap-static.xml')({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = getBaseUrl();

        const xml = generateSitemapXML([
          {loc: baseUrl, changefreq: 'daily', priority: 1.0},
          {
            loc: `${baseUrl}/preguntas-frecuentes`,
            changefreq: 'monthly',
            priority: 0.6,
          },
          {loc: `${baseUrl}/contacto`, changefreq: 'monthly', priority: 0.5},
          {loc: `${baseUrl}/garantia`, changefreq: 'monthly', priority: 0.5},
          {
            loc: `${baseUrl}/terminos-y-condiciones`,
            changefreq: 'yearly',
            priority: 0.3,
          },
          {
            loc: `${baseUrl}/politica-de-privacidad`,
            changefreq: 'yearly',
            priority: 0.3,
          },
        ]);

        return xmlResponse(xml);
      },
    },
  },
});
