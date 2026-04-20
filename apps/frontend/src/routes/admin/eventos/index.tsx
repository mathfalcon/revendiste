import {createFileRoute, useSearch, useNavigate} from '@tanstack/react-router';
import {z} from 'zod';
import {useQuery} from '@tanstack/react-query';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {Skeleton} from '~/components/ui/skeleton';
import {adminEventsQueryOptions} from '~/lib/api/admin';
import {EventCard} from '~/features/admin/events/EventCard';
import {EventCreateDialog} from '~/features/admin/events/EventCreateDialog';
import {useEffect, useRef, useState} from 'react';
import {Search, Plus} from 'lucide-react';
import {cn} from '~/lib/utils';

const eventsSearchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  sortBy: z
    .enum(['eventStartDate', 'name', 'createdAt'])
    .optional()
    .default('eventStartDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  includePast: z.boolean().optional().default(false),
  /** Incluye eventos con borrado lógico (p. ej. quitados del scrape por agotado) */
  includeDeleted: z.boolean().optional().default(false),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  platform: z.string().optional(),
});

export const Route = createFileRoute('/admin/eventos/')({
  component: EventsPage,
  validateSearch: eventsSearchSchema,
});

function EventCardSkeleton() {
  return (
    <div className='rounded-lg border bg-card overflow-hidden'>
      <Skeleton className='h-48 w-full rounded-none' />
      <div className='p-4 space-y-3'>
        <Skeleton className='h-5 w-3/4' />
        <Skeleton className='h-4 w-1/2' />
        <Skeleton className='h-4 w-2/3' />
        <div className='flex gap-2 pt-2'>
          <Skeleton className='h-5 w-20 rounded-full' />
          <Skeleton className='h-5 w-16 rounded-full' />
        </div>
      </div>
    </div>
  );
}

function EventsPage() {
  const search = useSearch({from: '/admin/eventos/'});
  const navigate = useNavigate({from: '/admin/eventos/'});
  const [searchInput, setSearchInput] = useState(search.search || '');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryParams = {
    page: search.page ?? 1,
    limit: search.limit ?? 20,
    sortBy: search.sortBy ?? ('eventStartDate' as const),
    sortOrder: search.sortOrder ?? ('asc' as const),
    includePast: search.includePast ?? false,
    includeDeleted: search.includeDeleted ?? false,
    search: search.search,
    status: search.status,
  };

  const {data, isLoading, isFetching} = useQuery({
    ...adminEventsQueryOptions(queryParams),
    placeholderData: prev => prev,
  });

  const showingPastEvents = search.includePast === true;
  const showingDeletedEvents = search.includeDeleted === true;

  useEffect(() => {
    setSearchInput(search.search || '');
  }, [search.search]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({
        search: prev => ({
          ...prev,
          search: value.trim() || undefined,
          page: 1,
        }),
      });
    }, 400);
  };

  const handleCardClick = (eventId: string) => {
    navigate({to: '/admin/eventos/$eventId', params: {eventId}});
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
        <Button onClick={() => setCreateDialogOpen(true)} size='lg'>
          <Plus className='mr-2 h-4 w-4' />
          Crear Evento
        </Button>
      </div>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Buscar eventos...'
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            className='pl-9'
          />
        </div>

        <Select
          value={search.status || 'all'}
          onValueChange={val => {
            navigate({
              search: prev => ({
                ...prev,
                status:
                  val !== 'all' ? (val as 'active' | 'inactive') : undefined,
                page: 1,
              }),
            });
          }}
        >
          <SelectTrigger className='w-full sm:w-40'>
            <SelectValue placeholder='Estado' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos</SelectItem>
            <SelectItem value='active'>Activos</SelectItem>
            <SelectItem value='inactive'>Inactivos</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showingPastEvents ? 'default' : 'outline'}
          onClick={() => {
            navigate({
              search: prev => ({
                ...prev,
                includePast: !showingPastEvents,
                page: 1,
              }),
            });
          }}
          className='w-full sm:w-auto'
        >
          {showingPastEvents ? 'Ocultar pasados' : 'Mostrar pasados'}
        </Button>

        <Button
          variant={showingDeletedEvents ? 'default' : 'outline'}
          onClick={() => {
            navigate({
              search: prev => ({
                ...prev,
                includeDeleted: !showingDeletedEvents,
                page: 1,
              }),
            });
          }}
          className='w-full sm:w-auto'
        >
          {showingDeletedEvents ? 'Ocultar eliminados' : 'Mostrar eliminados'}
        </Button>

        {search.search && (
          <Button
            onClick={() => {
              setSearchInput('');
              navigate({
                search: prev => ({
                  ...prev,
                  search: undefined,
                  page: 1,
                }),
              });
            }}
            variant='ghost'
            className='w-full sm:w-auto'
          >
            Limpiar
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({length: 6}).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className='flex items-center justify-center rounded-lg border border-dashed py-12'>
          <div className='text-center'>
            <h3 className='font-semibold mb-1'>No hay eventos</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              Intenta cambiar los filtros o crear un nuevo evento
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              Crear evento
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity',
            isFetching && 'opacity-50 pointer-events-none',
          )}
        >
          {data?.data.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => handleCardClick(event.id)}
            />
          ))}
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className='flex items-center justify-between gap-2'>
          <div className='text-sm text-muted-foreground'>
            Página {data.pagination.page} de {data.pagination.totalPages} (
            {data.pagination.total} eventos)
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={!data.pagination.hasPrev || isFetching}
              onClick={() => {
                navigate({
                  search: prev => ({
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
              size='sm'
              disabled={!data.pagination.hasNext || isFetching}
              onClick={() => {
                navigate({
                  search: prev => ({
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
      )}

      <EventCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
