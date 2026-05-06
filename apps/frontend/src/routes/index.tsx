import {createFileRoute} from '@tanstack/react-router';
import {z} from 'zod';
import {HomePage} from '~/features/home';
import {alternateHreflangEsUy, seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';
import {getEventsInfiniteQuery, getTrendingEventsQuery} from '~/lib';

const homeSearchSchema = z.object({
  ubicacion: z.string().optional().catch(undefined),
  lat: z.coerce.number().optional().catch(undefined),
  lng: z.coerce.number().optional().catch(undefined),
  desde: z.string().optional().catch(undefined),
  hasta: z.string().optional().catch(undefined),
  conEntradas: z.coerce.boolean().optional().catch(undefined),
});

type HomeSearch = z.infer<typeof homeSearchSchema>;

export const Route = createFileRoute('/')({
  component: Home,
  validateSearch: homeSearchSchema,
  // No search in loaderDeps: same-path filter navigations must not re-run this loader
  // (would trigger default route pending → fullscreen loader instead of HomeEvents skeletons).
  loader: async ({context, location}) => {
    const search = location.search as HomeSearch;
    const filters: Record<string, string | number | boolean> = {};

    if (search.ubicacion === 'cerca' && search.lat && search.lng) {
      filters.lat = search.lat;
      filters.lng = search.lng;
    } else if (search.ubicacion) {
      filters.region = search.ubicacion;
    }

    if (search.desde) filters.dateFrom = search.desde;
    if (search.hasta) filters.dateTo = search.hasta;
    if (search.conEntradas) filters.hasTickets = true;
    if (search.desde || search.hasta) {
      filters.tzOffset = new Date().getTimezoneOffset();
    }

    // Prefetch both queries in parallel — server is in the same VPC as the backend
    await Promise.all([
      context.queryClient.ensureQueryData(getTrendingEventsQuery(7, 6)),
      context.queryClient.ensureInfiniteQueryData(
        getEventsInfiniteQuery(20, filters),
      ),
    ]);
  },
  head: () => {
    const baseUrl = getBaseUrl();
    // Canonical origin without trailing slash (matches getBaseUrl / env)
    const origin = baseUrl.replace(/\/$/, '');
    // Google site-name docs use the domain root with trailing slash for WebSite.url
    const homePageUrl = `${origin}/`;
    const organizationId = `${homePageUrl}#organization`;
    const websiteId = `${homePageUrl}#website`;

    // Single @graph: Google recommends one WebSite node and linking Organization via publisher/@id
    // https://developers.google.com/search/docs/appearance/site-names
    const homeStructuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: 'Revendiste',
          url: homePageUrl,
          logo: `${origin}/android-chrome-512x512.png`,
          description:
            'Plataforma de compra y venta de entradas para conciertos, fiestas y eventos en Uruguay. Incluye reventa segura entre personas, custodia de fondos y vendedores verificados.',
          sameAs: [
            'https://twitter.com/revendiste',
            'https://www.instagram.com/revendiste',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: 'ayuda@revendiste.com',
            availableLanguage: 'Spanish',
          },
        },
        {
          '@type': 'WebSite',
          '@id': websiteId,
          name: 'Revendiste',
          url: homePageUrl,
          publisher: {'@id': organizationId},
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${origin}/eventos?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    };

    return {
      meta: [
        ...seo({
          title:
            'Revendiste | Comprá y vendé entradas de forma segura en Uruguay',
          description:
            'Comprá y vendé entradas para conciertos, fiestas y eventos en Uruguay. Operación entre personas con garantía, custodia de fondos y vendedores verificados: reventa segura en Revendiste.',
          keywords:
            'reventa de entradas Uruguay, revender entradas, comprar entradas reventa, reventa segura de entradas, compra y venta entradas Uruguay, entradas conciertos Montevideo, comprar entradas Uruguay, vender entradas, entradas fiestas Uruguay, entradas eventos, marketplace entradas Uruguay',
          baseUrl,
        }),
        {
          property: 'og:url',
          content: baseUrl,
        },
        // Additional meta tag for app purpose (for Google verification)
        {
          name: 'application-name',
          content:
            'Revendiste - Comprá y vendé entradas de forma segura en Uruguay',
        },
      ],
      links: [alternateHreflangEsUy(baseUrl), {rel: 'canonical', href: baseUrl}],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(homeStructuredData),
        },
      ],
    };
  },
});

function Home() {
  return <HomePage />;
}
