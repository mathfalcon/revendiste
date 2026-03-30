import {createFileRoute, useSearch, useNavigate} from '@tanstack/react-router';
import {z} from 'zod';
import {useSuspenseQuery} from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {Button} from '~/components/ui/button';
import {Badge} from '~/components/ui/badge';
import {Input} from '~/components/ui/input';
import {adminEventsQueryOptions} from '~/lib/api/admin';
import {EventEditDialog} from '~/features/admin/events/EventEditDialog';
import {useState} from 'react';
import {Edit, Search} from 'lucide-react';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';

const eventsSearchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  sortBy: z
    .enum(['eventStartDate', 'name', 'createdAt'])
    .optional()
    .default('eventStartDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  includePast: z.boolean().optional().default(false),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const Route = createFileRoute('/admin/eventos')({
  component: EventsPage,
  validateSearch: eventsSearchSchema,
  loaderDeps: ({search}) => ({
    page: search.page ?? 1,
    limit: search.limit ?? 20,
    sortBy: search.sortBy ?? 'eventStartDate',
    sortOrder: search.sortOrder ?? 'asc',
    includePast: search.includePast ?? false,
    search: search.search,
    status: search.status,
  }),
  loader: ({context, deps}) => {
    return context.queryClient.ensureQueryData(adminEventsQueryOptions(deps));
  },
});

function EventsPage() {
  const search = useSearch({from: '/admin/eventos'});
  const navigate = useNavigate({from: '/admin/eventos'});
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search.search || '');

  const {data} = useSuspenseQuery(
    adminEventsQueryOptions({
      page: search.page ?? 1,
      limit: search.limit ?? 20,
      sortBy: search.sortBy ?? 'eventStartDate',
      sortOrder: search.sortOrder ?? 'asc',
      includePast: search.includePast ?? false,
      search: search.search,
      status: search.status,
    }),
  );

  const showingPastEvents = search.includePast === true;

  const handleSearch = () => {
    navigate({
      search: (prev: typeof search) => ({
        ...prev,
        search: searchInput || undefined,
        page: 1,
      }),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusBadgeProps = (status: string) => {
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
        return {
          variant: 'outline' as const,
        };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      default:
        return status;
    }
  };

  const getQrTimingLabel = (timing: string | null) => {
    if (!timing) return '—';
    return timing;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMM yyyy, HH:mm", {locale: es});
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Eventos</h1>
          <p className='text-muted-foreground'>
            Gestiona los eventos y sus olas de entradas
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant={showingPastEvents ? 'default' : 'outline'}
            onClick={() => {
              navigate({
                search: (prev: typeof search) => ({
                  ...prev,
                  includePast: !showingPastEvents,
                  page: 1,
                }),
              });
            }}
          >
            {showingPastEvents ? 'Ocultar pasados' : 'Mostrar pasados'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className='flex gap-2'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Buscar eventos...'
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className='pl-9'
          />
        </div>
        <Button onClick={handleSearch} variant='secondary'>
          Buscar
        </Button>
        {search.search && (
          <Button
            onClick={() => {
              setSearchInput('');
              navigate({
                search: (prev: typeof search) => ({
                  ...prev,
                  search: undefined,
                  page: 1,
                }),
              });
            }}
            variant='ghost'
          >
            Limpiar
          </Button>
        )}
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Fecha Fin</TableHead>
              <TableHead>Lugar</TableHead>
              <TableHead>QR Timing</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center'>
                  No se encontraron eventos
                </TableCell>
              </TableRow>
            ) : (
              data.data.map(event => (
                <TableRow
                  key={event.id}
                  className='cursor-pointer hover:bg-muted/50'
                  onClick={() => setEditingEventId(event.id)}
                >
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      {event.images?.[0]?.url ? (
                        <img
                          src={event.images[0].url}
                          alt={event.name}
                          className='h-10 w-10 rounded object-cover'
                        />
                      ) : (
                        <div className='h-10 w-10 rounded bg-muted' />
                      )}
                      <div>
                        <div className='font-medium'>{event.name}</div>
                        <div className='text-xs text-muted-foreground'>
                          {event.platform}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(event.eventStartDate)}</TableCell>
                  <TableCell>{formatDate(event.eventEndDate)}</TableCell>
                  <TableCell>
                    <div className='max-w-[150px] truncate' title={event.venueName || event.venueAddress || undefined}>
                      {event.venueName || event.venueAddress || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='secondary'>
                      {getQrTimingLabel(event.qrAvailabilityTiming)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge {...getStatusBadgeProps(event.status)}>
                      {getStatusLabel(event.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={e => {
                        e.stopPropagation();
                        setEditingEventId(event.id);
                      }}
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between'>
        <div className='text-sm text-muted-foreground'>
          Mostrando {data.data.length} de {data.pagination.total} eventos
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            disabled={!data.pagination.hasPrev}
            onClick={() => {
              navigate({
                search: (prev: typeof search) => ({
                  ...prev,
                  page: (prev.page || 1) - 1,
                }),
              });
            }}
          >
            Anterior
          </Button>
          <Button
            variant='outline'
            disabled={!data.pagination.hasNext}
            onClick={() => {
              navigate({
                search: (prev: typeof search) => ({
                  ...prev,
                  page: (prev.page || 1) + 1,
                }),
              });
            }}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {editingEventId && (
        <EventEditDialog
          eventId={editingEventId}
          open={!!editingEventId}
          onOpenChange={open => !open && setEditingEventId(null)}
        />
      )}
    </div>
  );
}
