import {useState, useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {z} from 'zod';
import {AdminEventDetail} from '~/lib/api/generated';
import {
  adminEventDetailsQueryOptions,
  updateEventMutation,
} from '~/lib/api/admin';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';
import {Textarea} from '~/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Badge} from '~/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import {EventMetadataCard} from './EventMetadataCard';
import {EventImagesSection} from './EventImagesSection';
import {EventTicketWavesSection} from './EventTicketWavesSection';
import {VenueCombobox} from './VenueCombobox';
import {toast} from 'sonner';
import {Loader2, Trash2, ExternalLink, ArrowLeft} from 'lucide-react';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {deleteEventMutation} from '~/lib/api/admin';

const eventFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(),
  eventStartDate: z.string().min(1, 'La fecha de inicio es requerida'),
  eventEndDate: z.string().min(1, 'La fecha de fin es requerida'),
  externalUrl: z.string().optional(),
  qrAvailabilityTiming: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const QR_TIMINGS = ['3h', '6h', '12h', '24h', '48h', '72h'];

interface EventDetailPageProps {
  eventId: string;
  onBack: () => void;
}

function formatDateTimeLocal(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function EventDetailPage({eventId, onBack}: EventDetailPageProps) {
  const queryClient = useQueryClient();
  const {data: event, isLoading} = useQuery(
    adminEventDetailsQueryOptions(eventId),
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<
    {id: string; name: string; address: string; city: string} | undefined
  >();

  const form = useForm<EventFormValues>({
    resolver: standardSchemaResolver(eventFormSchema),
    defaultValues: {
      name: '',
      description: '',
      eventStartDate: '',
      eventEndDate: '',
      externalUrl: '',
      qrAvailabilityTiming: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (event) {
      form.reset({
        name: event.name,
        description: event.description || '',
        eventStartDate: formatDateTimeLocal(event.eventStartDate),
        eventEndDate: formatDateTimeLocal(event.eventEndDate),
        externalUrl: event.externalUrl || '',
        qrAvailabilityTiming: event.qrAvailabilityTiming || '',
        status: event.status as 'active' | 'inactive',
      });
    }
  }, [event, form]);

  const updateMutation = useMutation({
    ...updateEventMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'events']});
      toast.success('Evento actualizado');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al actualizar el evento',
      );
    },
  });

  const deleteMutation = useMutation({
    ...deleteEventMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'events']});
      toast.success('Evento eliminado');
      onBack();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al eliminar el evento',
      );
    },
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const onSubmit = (data: EventFormValues) => {
    updateMutation.mutate({
      eventId,
      updates: {
        name: data.name,
        description: data.description || null,
        eventStartDate: new Date(data.eventStartDate).toISOString(),
        eventEndDate: new Date(data.eventEndDate).toISOString(),
        externalUrl: data.externalUrl || '',
        qrAvailabilityTiming: data.qrAvailabilityTiming
          ? (data.qrAvailabilityTiming as any)
          : null,
        status: data.status,
      },
    });
  };

  const heroImage = event.images?.find(img => img.imageType === 'hero');

  return (
    <div className='space-y-6'>
      {/* Header with Back Button */}
      <div className='flex items-center gap-2'>
        <Button variant='ghost' size='sm' onClick={onBack}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Volver
        </Button>
      </div>

      {/* Hero Section */}
      <div className='relative h-48 md:h-64 rounded-lg overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800'>
        {heroImage ? (
          <img
            src={heroImage.url}
            alt={event.name}
            className='h-full w-full object-cover'
          />
        ) : null}
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />
        <div className='absolute inset-0 flex flex-col justify-end p-6 text-white'>
          <h1 className='text-3xl md:text-4xl font-bold mb-2'>{event.name}</h1>
          <div className='flex gap-2 flex-wrap'>
            <Badge className='bg-white text-black'>{event.platform}</Badge>
            <Badge
              variant='outline'
              className={
                event.status === 'active'
                  ? 'border-green-400 text-green-100'
                  : 'border-gray-400 text-gray-100'
              }
            >
              {event.status === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column: Edit Form */}
        <div className='lg:col-span-2 space-y-6'>
          {/* General Info */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Información General</CardTitle>
              <CardDescription>
                Edita los detalles básicos del evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-4'
                >
                  <FormField
                    control={form.control}
                    name='name'
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='description'
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='eventStartDate'
                      render={({field}) => (
                        <FormItem>
                          <FormLabel>Fecha de Inicio</FormLabel>
                          <FormControl>
                            <Input type='datetime-local' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='eventEndDate'
                      render={({field}) => (
                        <FormItem>
                          <FormLabel>Fecha de Fin</FormLabel>
                          <FormControl>
                            <Input type='datetime-local' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='externalUrl'
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>URL Externa</FormLabel>
                        <FormControl>
                          <Input
                            type='url'
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='qrAvailabilityTiming'
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Disponibilidad de los QR</FormLabel>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Sin restricción' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='none'>
                              Sin restricción
                            </SelectItem>
                            {QR_TIMINGS.map(t => (
                              <SelectItem key={t} value={t}>
                                {t} horas antes
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='status'
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='active'>Activo</SelectItem>
                            <SelectItem value='inactive'>Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type='submit'
                    disabled={updateMutation.isPending}
                    className='w-full'
                  >
                    {updateMutation.isPending && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    Guardar Cambios
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Venue */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Lugar</CardTitle>
              <CardDescription>
                Dónde se llevará a cabo el evento
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {event.venueName && (
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    Lugar actual
                  </div>
                  <div className='text-sm'>
                    <div className='font-medium'>{event.venueName}</div>
                    {event.venueAddress && (
                      <div className='text-muted-foreground text-xs'>
                        {event.venueAddress}
                      </div>
                    )}
                    {event.venueCity && (
                      <div className='text-muted-foreground text-xs'>
                        {event.venueCity}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Waves */}
          <EventTicketWavesSection event={event} />
        </div>

        {/* Right Column: Sidebar */}
        <div className='space-y-6'>
          {/* Images */}
          <EventImagesSection event={event} />

          {/* Metadata */}
          <EventMetadataCard event={event} />

          {/* Quick Actions */}
          <Card className='border-destructive/20'>
            <CardHeader>
              <CardTitle className='text-lg'>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {event.externalUrl && (
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  asChild
                >
                  <a href={event.externalUrl} target='_blank' rel='noreferrer'>
                    <ExternalLink className='mr-2 h-4 w-4' />
                    Abrir en línea
                  </a>
                </Button>
              )}
              <Button
                variant='destructive'
                className='w-full justify-start'
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Eliminar Evento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El evento y todas sus olas de
              tickets serán eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({eventId})}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
