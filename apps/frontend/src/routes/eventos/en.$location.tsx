import {createFileRoute, notFound, useNavigate} from '@tanstack/react-router';
import {z} from 'zod';
import {useCallback} from 'react';
import {EventListingPage} from '~/features/event-listing';
import {getEventsPaginatedQuery, getRegionsQuery} from '~/lib';
import {seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';
import {
  slugToRegion,
  formatRegionDisplay,
  getRegionSeoMeta,
  regionToSlug,
} from '~/utils/location-slugs';
import type {LocationFilter} from '~/features/home/LocationFilter';

const searchSchema = z.object({
  desde: z.string().optional().catch(undefined),
  hasta: z.string().optional().catch(undefined),
  conEntradas: z.coerce.boolean().optional().catch(undefined),
});

export const Route = createFileRoute('/eventos/en/$location')({
  validateSearch: searchSchema,
  loaderDeps: ({search}) => ({search}),
  loader: async ({context, params, deps: {search}}) => {
    const regionData =
      await context.queryClient.ensureQueryData(getRegionsQuery());
    const regionName = slugToRegion(params.location, regionData);

    if (!regionName) {
      throw notFound();
    }

    const filters: Record<string, string | number | boolean> = {
      region: regionName,
    };
    if (search.desde) filters.dateFrom = search.desde;
    if (search.hasta) filters.dateTo = search.hasta;
    if (search.conEntradas) filters.hasTickets = true;
    if (search.desde || search.hasta) {
      filters.tzOffset = new Date().getTimezoneOffset();
    }

    await context.queryClient.ensureQueryData(
      getEventsPaginatedQuery({limit: 100, page: 1}, filters),
    );

    return {regionName};
  },
  head: ({loaderData, params}) => {
    const baseUrl = getBaseUrl();
    const regionName = loaderData?.regionName;

    if (!regionName) return {};

    const display = formatRegionDisplay(regionName);
    const meta = getRegionSeoMeta(regionName);
    const canonical = `${baseUrl}/eventos/en/${params.location}`;

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Eventos en ${display}`,
      description: meta.description,
      url: canonical,
      about: {
        '@type': 'Place',
        name: display,
        address: {
          '@type': 'PostalAddress',
          addressRegion: display,
          addressCountry: 'UY',
        },
      },
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: `Eventos en ${display}`,
          item: canonical,
        },
      ],
    };

    return {
      meta: [
        ...seo({
          title: meta.title,
          description: meta.description,
          keywords: meta.keywords,
          baseUrl,
        }),
        {property: 'og:url', content: canonical},
      ],
      links: [{rel: 'canonical', href: canonical}],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(collectionSchema),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify(breadcrumbSchema),
        },
      ],
    };
  },
  component: RegionEventsPage,
});

function RegionEventsPage() {
  const {regionName} = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({from: '/eventos/en/$location'});
  const display = formatRegionDisplay(regionName);

  const locationFilter: LocationFilter = {
    type: 'region',
    regions: [regionName],
    dateFrom: search.desde,
    dateTo: search.hasta,
    hasTickets: search.conEntradas || undefined,
  };

  const handleLocationChange = useCallback(
    (filter: LocationFilter) => {
      // If user clears location, navigate to homepage
      if (
        filter.type === 'all' &&
        !filter.dateFrom &&
        !filter.dateTo &&
        !filter.hasTickets
      ) {
        navigate({to: '/', search: {}});
        return;
      }

      // If user switches to a different region, navigate to that region's page
      if (filter.type === 'region' && filter.regions?.length === 1) {
        const newSlug = regionToSlug(filter.regions[0]!);
        navigate({
          to: '/eventos/en/$location',
          params: {location: newSlug},
          search: {
            desde: filter.dateFrom,
            hasta: filter.dateTo,
            conEntradas: filter.hasTickets || undefined,
          },
          replace: true,
          resetScroll: false,
        });
        return;
      }

      // For other changes (date, hasTickets), update search params on current route
      navigate({
        search: {
          desde: filter.dateFrom,
          hasta: filter.dateTo,
          conEntradas: filter.hasTickets || undefined,
        },
        replace: true,
        resetScroll: false,
      });
    },
    [navigate],
  );

  return (
    <EventListingPage
      heading={`Eventos en ${display}`}
      description={`Encontrá entradas para conciertos, fiestas y eventos en ${display}. Compra segura con garantía en Revendiste.`}
      locationFilter={locationFilter}
      onLocationChange={handleLocationChange}
    />
  );
}
