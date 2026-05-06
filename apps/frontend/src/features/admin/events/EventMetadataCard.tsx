import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Badge} from '~/components/ui/badge';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import type {AdminEventDetail} from '~/lib/api/admin/admin-event-types';

interface EventMetadataCardProps {
  event: AdminEventDetail;
}

export function EventMetadataCard({event}: EventMetadataCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Metadatos</CardTitle>
        <CardDescription>Información del sistema</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='space-y-2'>
          <div className='text-sm font-medium text-muted-foreground'>
            Plataforma
          </div>
          <Badge variant='outline'>{event.platform}</Badge>
        </div>

        <div className='space-y-2'>
          <div className='text-sm font-medium text-muted-foreground'>
            ID Externo
          </div>
          <code className='text-xs bg-muted px-2 py-1 rounded break-all'>
            {event.externalId}
          </code>
        </div>

        <div className='space-y-2'>
          <div className='text-sm font-medium text-muted-foreground'>
            ID del Evento
          </div>
          <code className='text-xs bg-muted px-2 py-1 rounded break-all'>
            {event.id}
          </code>
        </div>

        <div className='space-y-2'>
          <div className='text-sm font-medium text-muted-foreground'>
            Creado
          </div>
          <div className='text-sm'>
            {format(new Date(event.createdAt), 'd MMM yyyy HH:mm', {
              locale: es,
            })}
          </div>
        </div>

        <div className='space-y-2'>
          <div className='text-sm font-medium text-muted-foreground'>
            Actualizado
          </div>
          <div className='text-sm'>
            {format(new Date(event.updatedAt), 'd MMM yyyy HH:mm', {
              locale: es,
            })}
          </div>
        </div>

        <div className='space-y-2'>
          <div className='text-sm font-medium text-muted-foreground'>
            Última vez scrapeado
          </div>
          <div className='text-sm'>
            {format(new Date(event.lastScrapedAt), 'd MMM yyyy HH:mm', {
              locale: es,
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
