import {createFileRoute} from '@tanstack/react-router';
import {getBaseUrl} from '~/config/env';

// Legacy /sitemap URL — permanently redirect to canonical /sitemap.xml
export const Route = createFileRoute('/sitemap')({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = getBaseUrl();
        return new Response(null, {
          status: 301,
          headers: {
            Location: `${baseUrl}/sitemap.xml`,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      },
    },
  },
});
