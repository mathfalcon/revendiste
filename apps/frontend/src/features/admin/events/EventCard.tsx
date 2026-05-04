import type {AdminEvent} from '~/lib/api/admin/admin-event-types';
import {Badge} from '~/components/ui/badge';
import {Calendar, MapPin, Ticket} from 'lucide-react';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {cn} from '~/lib/utils';

interface EventCardProps {
  event: AdminEvent;
  onClick?: () => void;
}

const platformColors: Record<
  string,
  {bg: string; text: string; badge: string}
> = {
  entraste: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    badge: 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
  redtickets: {
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    badge: 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400',
  },
  passline: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-400',
    badge:
      'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400',
  },
  default: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-400',
    badge:
      'border-slate-500 bg-slate-500/10 text-slate-700 dark:text-slate-400',
  },
};

function getPlatformColor(platform: string) {
  return platformColors[platform.toLowerCase()] || platformColors.default;
}

function getStatusBadgeProps(status: string) {
  switch (status) {
    case 'active':
      return {
        variant: 'outline' as const,
        className:
          'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400',
      };
    case 'inactive':
      return {
        variant: 'outline' as const,
        className:
          'border-gray-500 bg-gray-500/10 text-gray-700 dark:text-gray-400',
      };
    default:
      return {variant: 'outline' as const};
  }
}

export function EventCard({event, onClick}: EventCardProps) {
  const platformColor =
    getPlatformColor(event.platform) || platformColors.default!;
  const startDate = new Date(event.eventStartDate);
  const endDate = new Date(event.eventEndDate);
  const formattedStart = format(startDate, 'd MMM', {locale: es});
  const formattedEnd = format(endDate, 'd MMM yyyy', {locale: es});

  return (
    <div
      onClick={onClick}
      className='group cursor-pointer rounded-lg border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/50'
    >
      {/* Image Header */}
      <div className='relative h-48 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800'>
        {event.images?.[0]?.url ? (
          <img
            src={event.images[0].url}
            alt={event.name}
            className='h-full w-full object-cover group-hover:scale-105 transition-transform duration-200'
          />
        ) : (
          <div className={cn('h-full w-full', platformColor.bg)} />
        )}
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
      </div>

      {/* Content */}
      <div className='p-4 space-y-3'>
        {/* Title */}
        <div>
          <h3 className='font-semibold line-clamp-2 text-foreground'>
            {event.name}
          </h3>
        </div>

        {/* Date */}
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Calendar className='h-4 w-4 flex-shrink-0' />
          <span>
            {formattedStart} - {formattedEnd}
          </span>
        </div>

        {/* Venue */}
        {(event.venueName || event.venueAddress) && (
          <div className='flex items-start gap-2 text-sm text-muted-foreground'>
            <MapPin className='h-4 w-4 flex-shrink-0 mt-0.5' />
            <span className='line-clamp-1'>
              {event.venueName || event.venueAddress}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className='flex flex-wrap gap-2 pt-2'>
          {/* Platform */}
          <Badge
            variant='outline'
            className={cn('border-l-2', platformColor.badge)}
          >
            {event.platform}
          </Badge>

          {/* Status */}
          <Badge {...getStatusBadgeProps(event.status)}>
            {event.status === 'active' ? 'Activo' : 'Inactivo'}
          </Badge>

          {event.deletedAt ? (
            <Badge
              variant='outline'
              className='border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-200'
            >
              Eliminado
            </Badge>
          ) : null}

          {/* Ticket Waves Count */}
          {event.ticketWaves?.length > 0 && (
            <Badge variant='secondary' className='flex items-center gap-1'>
              <Ticket className='h-3 w-3' />
              {event.ticketWaves.length}
            </Badge>
          )}

          {/* QR Timing */}
          {event.qrAvailabilityTiming && (
            <Badge variant='outline' className='text-xs'>
              QR: {event.qrAvailabilityTiming}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
