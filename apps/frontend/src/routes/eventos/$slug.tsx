import {createFileRoute, redirect} from '@tanstack/react-router';
import {Suspense} from 'react';
import {FullScreenLoading} from '~/components';
import {EventPage} from '~/features/event';
import {
  getEventBySlugQuery,
  EventImageType,
  getApiBaseURL,
  GetEventBySlugResponse,
} from '~/lib';
import {isAxiosError} from 'axios';
import {seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';
import {EventEnded} from '~/components/EventEnded';
import type {ErrorComponentProps} from '@tanstack/react-router';
import {createServerFn} from '@tanstack/react-start';
import {auth} from '@clerk/tanstack-react-start/server';

/**
 * Server-only function to fetch event data and track views.
 * This runs exclusively on the server, hiding the API endpoint from clients.
 */
export const fetchEventServer = createServerFn({method: 'GET'})
  .inputValidator((data: {slug: string; trackView: boolean}) => data)
  .handler(async ({data}) => {
    const apiUrl = getApiBaseURL();

    // Get auth token to forward to backend (needed to filter out user's own listings)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    try {
      const {getToken} = await auth();
      const token = await getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Auth not available — request proceeds as anonymous
    }

    // Fetch event data on the server by slug
    const response = await fetch(
      `${apiUrl}/events/by-slug/${data.slug}`,
      {
        method: 'GET',
        headers,
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('404: Event not found');
      }
      if (response.status === 401) {
        throw new Error('401: Unauthorized');
      }
      throw new Error(`Failed to fetch event: ${response.status}`);
    }

    const eventData: GetEventBySlugResponse = await response.json();

    // Track view only on actual navigation (fire-and-forget)
    if (data.trackView) {
      fetch(`${apiUrl}/events/by-slug/${data.slug}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Silently ignore errors - view tracking is not critical
      });
    }

    return eventData;
  });

export const Route = createFileRoute('/eventos/$slug')({
  component: RouteComponent,
  notFoundComponent: () => <EventEnded />,
  errorComponent: ({error}: ErrorComponentProps) => {
    if (isAxiosError(error) && error.response?.status === 404) {
      return <EventEnded />;
    }

    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('404')
    ) {
      return <EventEnded />;
    }
    throw error;
  },
  loader: async ({context, params, cause}) => {
    try {
      // Fetch event data on the server (hides API endpoint from client)
      const eventData = await fetchEventServer({
        data: {
          slug: params.slug,
          trackView: cause === 'enter', // Only track view on actual navigation
        },
      });

      // Seed the React Query cache with the server-fetched data
      context.queryClient.setQueryData(
        getEventBySlugQuery(params.slug).queryKey,
        eventData,
      );

      return eventData;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw redirect({
            to: '/ingresar/$',
          });
        }
        if (error.message.includes('404')) {
          throw error;
        }
      }
      if (isAxiosError(error) && error.response?.status === 401) {
        throw redirect({
          to: '/ingresar/$',
        });
      }
      throw error;
    }
  },
  head: ({loaderData, match}) => {
    if (!loaderData) {
      return {
        meta: [
          {
            title: 'Evento | Revendiste',
          },
        ],
      };
    }

    const event = loaderData;
    // Prefer og_hero (watermarked) for meta tags, fall back to hero
    const ogHeroImage = event.eventImages.find(
      img => img.imageType === EventImageType.OgHero,
    );
    const heroImage = event.eventImages.find(
      img => img.imageType === EventImageType.Hero,
    );
    const metaImage = ogHeroImage || heroImage;

    // Get base URL for canonical and absolute URLs
    const baseUrl = getBaseUrl();
    const canonicalUrl = `${baseUrl}${match.pathname}`;

    // Format event date for display
    const eventDate = event.eventStartDate
      ? new Date(event.eventStartDate).toLocaleDateString('es-UY', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;

    // Build description with event details
    const rawDesc = event.description
      ? event.description.replace(/\s+/g, ' ').trim()
      : null;
    const truncatedDesc = rawDesc && rawDesc.length > 120
      ? rawDesc.slice(0, 120) + '…'
      : rawDesc;
    const description = truncatedDesc
      ? `${truncatedDesc}${eventDate ? ` - ${eventDate}` : ''}${
          event.venueName ? ` en ${event.venueName}` : ''
        }`
      : `Comprá entradas para ${event.name}${eventDate ? ` el ${eventDate}` : ''}${
          event.venueName ? ` en ${event.venueName}` : ''
        }. Compra segura con garantía en Revendiste.`;

    // Get absolute URL for image (required for Open Graph)
    const imageUrl = metaImage?.url
      ? metaImage.url.startsWith('http')
        ? metaImage.url
        : `${baseUrl}${metaImage.url.startsWith('/') ? '' : '/'}${metaImage.url}`
      : undefined;

    // Build keywords from event data
    const keywords = [
      `entradas ${event.name}`,
      `comprar entradas ${event.name}`,
      event.venueName ? `entradas ${event.venueName}` : null,
      event.name,
      event.venueName,
      'comprar entradas Uruguay',
      'entradas eventos',
      'revendiste',
      eventDate?.split(' ')[2], // Year
    ]
      .filter(Boolean)
      .join(', ');

    // Get base SEO tags (this includes og:type: 'website' by default)
    const baseSeoTags = seo({
      title: `${event.name} | Revendiste`,
      description,
      image: imageUrl,
      keywords,
      baseUrl,
    });

    // Override og:type to 'event' for event pages (now using property attribute)
    const seoTags = baseSeoTags.map(tag => {
      if ('property' in tag && tag.property === 'og:type') {
        return {property: 'og:type', content: 'event'};
      }
      return tag;
    });

    // Generate structured data (JSON-LD) for the event
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.name,
      description: (event.description ?? description).replace(/\s+/g, ' ').trim(),
      startDate: event.eventStartDate,
      endDate: event.eventEndDate || event.eventStartDate,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: event.venueName || 'Venue',
        address: {
          '@type': 'PostalAddress',
          streetAddress: event.venueAddress,
          addressLocality: event.venueName,
        },
        ...(event.venueLatitude && event.venueLongitude
          ? {
              geo: {
                '@type': 'GeoCoordinates',
                latitude: parseFloat(event.venueLatitude),
                longitude: parseFloat(event.venueLongitude),
              },
            }
          : {}),
      },
      image: imageUrl ? [imageUrl] : undefined,
      offers: {
        '@type': 'AggregateOffer',
        availability: 'https://schema.org/InStock',
        priceCurrency: 'UYU',
        url: canonicalUrl,
      },
      organizer: {
        '@type': 'Organization',
        name: 'Revendiste',
        url: baseUrl,
      },
    };

    return {
      meta: [
        ...seoTags,
        // Additional event-specific meta tags (using property for OG tags)
        {
          property: 'og:url',
          content: canonicalUrl,
        },
        ...(event.eventStartDate
          ? [
              {
                property: 'event:start_time',
                content: new Date(event.eventStartDate).toISOString(),
              },
            ]
          : []),
        ...(event.eventEndDate
          ? [
              {
                property: 'event:end_time',
                content: new Date(event.eventEndDate).toISOString(),
              },
            ]
          : []),
        ...(event.venueName
          ? [
              {
                property: 'event:venue:name',
                content: event.venueName,
              },
            ]
          : []),
        ...(event.venueAddress
          ? [
              {
                property: 'event:venue:address',
                content: event.venueAddress,
              },
            ]
          : []),
      ],
      links: [
        {
          rel: 'canonical',
          href: canonicalUrl,
        },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(structuredData, null, 2),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify({
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
                name: 'Eventos',
                item: `${baseUrl}/eventos`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: event.name,
                item: canonicalUrl,
              },
            ],
          }),
        },
      ],
    };
  },
});

function RouteComponent() {
  return (
    <Suspense fallback={<FullScreenLoading />}>
      <EventPage />
    </Suspense>
  );
}
