import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {useCallback} from 'react';
import {EventListingPage} from '~/features/event-listing';
import {getEventsPaginatedQuery} from '~/lib';
import {alternateHreflangEsUy, seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';
import {getWeekendDateRange} from '~/utils/date-presets';
import {regionToSlug} from '~/utils/location-slugs';
import type {LocationFilter} from '~/features/home/LocationFilter';

export const Route = createFileRoute('/eventos/este-fin-de-semana')({
  loader: async ({context}) => {
    const {from, to} = getWeekendDateRange();

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
    const canonical = `${baseUrl}/eventos/este-fin-de-semana`;

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Eventos este fin de semana en Uruguay',
      description:
        'Descubrí todos los eventos de este fin de semana en Uruguay. Comprá y vendé entradas con garantía en Revendiste, incluida reventa segura entre personas.',
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
          name: 'Eventos este fin de semana',
          item: canonical,
        },
      ],
    };

    return {
      meta: [
        ...seo({
          title: 'Eventos este fin de semana en Uruguay | Revendiste',
          description:
            'Descubrí todos los eventos de este fin de semana en Uruguay. Comprá y vendé entradas con garantía en Revendiste, incluida reventa segura entre personas.',
          keywords:
            'eventos fin de semana, eventos este finde Uruguay, reventa entradas Uruguay, conciertos fin de semana, fiestas viernes sábado, qué hacer este fin de semana Uruguay',
          baseUrl,
        }),
        {property: 'og:url', content: canonical},
      ],
      links: [
        alternateHreflangEsUy(canonical),
        {rel: 'canonical', href: canonical},
      ],
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
  component: WeekendEventsPage,
});

function WeekendEventsPage() {
  const {dateFrom, dateTo} = Route.useLoaderData();
  const navigate = useNavigate({from: '/eventos/este-fin-de-semana'});

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

      // If user changes filters, go to homepage with those filters
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
      heading='Eventos este fin de semana'
      description='Todos los eventos de este fin de semana en Uruguay.'
      locationFilter={locationFilter}
      onLocationChange={handleLocationChange}
    />
  );
}
