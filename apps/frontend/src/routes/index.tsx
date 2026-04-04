import {createFileRoute} from '@tanstack/react-router';
import {z} from 'zod';
import {HomePage} from '~/features';
import {seo} from '~/utils/seo';
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

export const Route = createFileRoute('/')({
  component: Home,
  validateSearch: homeSearchSchema,
  loaderDeps: ({search}) => ({search}),
  loader: async ({context, deps: {search}}) => {
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

    // Organization structured data for homepage
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Revendiste',
      url: baseUrl,
      logo: `${baseUrl}/android-chrome-512x512.png`,
      description:
        'Plataforma de compra y venta segura de entradas para conciertos, fiestas y eventos en Uruguay. Custodia de fondos y vendedores verificados.',
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
    };

    // Website structured data
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Revendiste',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/eventos?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    return {
      meta: [
        ...seo({
          title:
            'Revendiste | Comprá y vendé entradas de forma segura en Uruguay',
          description:
            'Comprá entradas para conciertos, fiestas y eventos en Uruguay con garantía de compra. Vendé las que no vas a usar de forma segura. Custodia de fondos y vendedores verificados.',
          keywords:
            'comprar entradas Uruguay, vender entradas, entradas conciertos Montevideo, reventa segura de entradas, entradas fiestas Uruguay, entradas eventos, transferir entradas',
          baseUrl,
        }),
        {
          property: 'og:url',
          content: baseUrl,
        },
        // Additional meta tag for app purpose (for Google verification)
        {
          name: 'application-name',
          content: 'Revendiste - Compra y venta segura de entradas en Uruguay',
        },
      ],
      links: [
        {
          rel: 'canonical',
          href: baseUrl,
        },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(organizationSchema),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify(websiteSchema),
        },
      ],
    };
  },
});

function Home() {
  return <HomePage />;
}
