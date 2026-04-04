import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {useCallback} from 'react';
import {EventListingPage} from '~/features/event-listing';
import {getEventsPaginatedQuery} from '~/lib';
import {seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';
import {getTodayDateRange} from '~/utils/date-presets';
import {regionToSlug} from '~/utils/location-slugs';
import type {LocationFilter} from '~/features/home/LocationFilter';

export const Route = createFileRoute('/eventos/hoy')({
  loader: async ({context}) => {
    const {from, to} = getTodayDateRange();

    await context.queryClient.ensureQueryData(
      getEventsPaginatedQuery(
        {limit: 100, page: 1},
        {
          dateFrom: from,
          dateTo: to,
          tzOffset: new Date().getTimezoneOffset(),
        },
      ),
    );

    return {dateFrom: from, dateTo: to};
  },
  head: () => {
    const baseUrl = getBaseUrl();
    const canonical = `${baseUrl}/eventos/hoy`;

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Eventos hoy en Uruguay',
      description:
        'Descubrí todos los eventos que pasan hoy en Uruguay. Conciertos, fiestas y más con compra segura en Revendiste.',
      url: canonical,
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
          name: 'Eventos hoy',
          item: canonical,
        },
      ],
    };

    return {
      meta: [
        ...seo({
          title: 'Eventos hoy en Uruguay | Revendiste',
          description:
            'Descubrí todos los eventos que pasan hoy en Uruguay. Conciertos, fiestas y más con compra segura en Revendiste.',
          keywords:
            'eventos hoy, eventos hoy Uruguay, conciertos hoy, fiestas hoy, qué hacer hoy Uruguay',
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
  component: TodayEventsPage,
});

function TodayEventsPage() {
  const {dateFrom, dateTo} = Route.useLoaderData();
  const navigate = useNavigate({from: '/eventos/hoy'});

  const locationFilter: LocationFilter = {
    type: 'all',
    dateFrom,
    dateTo,
  };

  const handleLocationChange = useCallback(
    (filter: LocationFilter) => {
      // If user selects a region, navigate to that region page
      if (filter.type === 'region' && filter.regions?.length === 1) {
        navigate({
          to: '/eventos/en/$location',
          params: {location: regionToSlug(filter.regions[0]!)},
          search: {
            desde: filter.dateFrom,
            hasta: filter.dateTo,
            conEntradas: filter.hasTickets || undefined,
          },
        });
        return;
      }

      // If user changes date or clears everything, go to homepage with filters
      navigate({
        to: '/',
        search: {
          ubicacion:
            filter.type === 'all'
              ? undefined
              : filter.type === 'nearby'
                ? 'cerca'
                : filter.regions?.join(','),
          lat: filter.type === 'nearby' ? filter.lat : undefined,
          lng: filter.type === 'nearby' ? filter.lng : undefined,
          desde: filter.dateFrom,
          hasta: filter.dateTo,
          conEntradas: filter.hasTickets || undefined,
        },
      });
    },
    [navigate],
  );

  return (
    <EventListingPage
      heading='Eventos hoy'
      description='Todos los eventos que pasan hoy en Uruguay.'
      locationFilter={locationFilter}
      onLocationChange={handleLocationChange}
    />
  );
}
