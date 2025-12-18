import {createFileRoute, redirect} from '@tanstack/react-router';
import {Suspense} from 'react';
import {FullScreenLoading} from '~/components';
import {EventPage} from '~/features/event';
import {getEventByIdQuery, EventImageType} from '~/lib';
import {AxiosError} from 'axios';
import {seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';

export const Route = createFileRoute('/eventos/$eventId')({
  component: RouteComponent,
  loader: async ({context, params}) => {
    try {
      return await context.queryClient.ensureQueryData(
        getEventByIdQuery(params.eventId),
      );
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
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
    const heroImage = event.eventImages.find(
      img => img.imageType === EventImageType.Hero,
    );

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
    const description = event.description
      ? `${event.description}${eventDate ? ` - ${eventDate}` : ''}${
          event.venueName ? ` en ${event.venueName}` : ''
        }`
      : `Evento${eventDate ? ` el ${eventDate}` : ''}${
          event.venueName ? ` en ${event.venueName}` : ''
        }. Encuentra entradas disponibles en Revendiste.`;

    // Get absolute URL for image (required for Open Graph)
    const imageUrl = heroImage?.url
      ? heroImage.url.startsWith('http')
        ? heroImage.url
        : `${baseUrl}${heroImage.url.startsWith('/') ? '' : '/'}${heroImage.url}`
      : undefined;

    // Build keywords from event data
    const keywords = [
      event.name,
      event.venueName,
      'entradas',
      'eventos',
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
    });

    // Override og:type to 'event' for event pages
    const seoTags = baseSeoTags.map(tag => {
      if (tag.name === 'og:type') {
        return {name: 'og:type', content: 'event'};
      }
      return tag;
    });

    // Generate structured data (JSON-LD) for the event
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.name,
      description: event.description || description,
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
        // Additional event-specific meta tags
        {
          name: 'og:url',
          content: canonicalUrl,
        },
        ...(event.eventStartDate
          ? [
              {
                name: 'event:start_time',
                content: new Date(event.eventStartDate).toISOString(),
              },
            ]
          : []),
        ...(event.eventEndDate
          ? [
              {
                name: 'event:end_time',
                content: new Date(event.eventEndDate).toISOString(),
              },
            ]
          : []),
        ...(event.venueName
          ? [
              {
                name: 'event:venue:name',
                content: event.venueName,
              },
            ]
          : []),
        ...(event.venueAddress
          ? [
              {
                name: 'event:venue:address',
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
