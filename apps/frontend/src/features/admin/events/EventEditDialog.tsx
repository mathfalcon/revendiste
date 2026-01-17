import {useState, useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {z} from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {Textarea} from '~/components/ui/textarea';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '~/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {Badge} from '~/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {
  adminEventDetailsQueryOptions,
  updateEventMutation,
  deleteEventMutation,
  deleteTicketWaveMutation,
  uploadEventImageMutation,
  deleteEventImageMutation,
} from '~/lib/api/admin';
import {toast} from 'sonner';
import {Loader2, Trash2, Plus, Upload, X} from 'lucide-react';
import {TicketWaveEditDialog} from './TicketWaveEditDialog';
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
import {QrAvailabilityTiming} from '@revendiste/shared';

// Form schema
const eventFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  eventStartDate: z.string().min(1, 'La fecha de inicio es requerida'),
  eventEndDate: z.string().min(1, 'La fecha de fin es requerida'),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  externalUrl: z.string().optional(),
  qrAvailabilityTiming: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventEditDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventEditDialog({
  eventId,
  open,
  onOpenChange,
}: EventEditDialogProps) {
  const queryClient = useQueryClient();
  const {data: event, isLoading} = useQuery(
    adminEventDetailsQueryOptions(eventId),
  );

  // Form setup
  const form = useForm<EventFormValues>({
    resolver: standardSchemaResolver(eventFormSchema),
    defaultValues: {
      name: '',
      description: '',
      eventStartDate: '',
      eventEndDate: '',
      venueName: '',
      venueAddress: '',
      externalUrl: '',
      qrAvailabilityTiming: '',
      status: 'active',
    },
  });

  // Dialog states
  const [editingWaveId, setEditingWaveId] = useState<string | null>(null);
  const [creatingWave, setCreatingWave] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingWaveId, setDeletingWaveId] = useState<string | null>(null);

  // Initialize form when event data loads
  useEffect(() => {
    if (event) {
      form.reset({
        name: event.name,
        description: event.description || '',
        eventStartDate: formatDateTimeLocal(event.eventStartDate),
        eventEndDate: formatDateTimeLocal(event.eventEndDate),
        venueName: event.venueName || '',
        venueAddress: event.venueAddress || '',
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
      toast.success('Evento actualizado exitosamente');
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
      toast.success('Evento eliminado exitosamente');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al eliminar el evento',
      );
    },
  });

  const deleteWaveMutation = useMutation({
    ...deleteTicketWaveMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'events', eventId]});
      toast.success('Tanda de tickets eliminada');
      setDeletingWaveId(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          'Error al eliminar la tanda de tickets',
      );
    },
  });

  const uploadImageMutation = useMutation({
    ...uploadEventImageMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'events', eventId]});
      toast.success('Imagen subida exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al subir la imagen');
    },
  });

  const deleteImageMutation = useMutation({
    ...deleteEventImageMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'events', eventId]});
      toast.success('Imagen eliminada');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al eliminar la imagen',
      );
    },
  });

  const onSubmit = (data: EventFormValues) => {
    updateMutation.mutate({
      eventId,
      updates: {
        name: data.name,
        description: data.description || null,
        eventStartDate: new Date(data.eventStartDate).toISOString(),
        eventEndDate: new Date(data.eventEndDate).toISOString(),
        venueName: data.venueName || null,
        venueAddress: data.venueAddress || '',
        externalUrl: data.externalUrl || '',
        qrAvailabilityTiming: data.qrAvailabilityTiming
          ? (data.qrAvailabilityTiming as QrAvailabilityTiming)
          : null,
        status: data.status,
      },
    });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    imageType: 'flyer' | 'hero',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadImageMutation.mutate({eventId, file, imageType});
    e.target.value = ''; // Reset input
  };

  const handleDeleteWave = (waveId: string) => {
    setDeletingWaveId(waveId);
  };

  const confirmDeleteWave = () => {
    if (deletingWaveId) {
      deleteWaveMutation.mutate({eventId, waveId: deletingWaveId});
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className='flex items-center justify-center p-8'>
            <Loader2 className='h-6 w-6 animate-spin' />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!event) {
    return null;
  }

  const flyerImage = event.images?.find(img => img.imageType === 'flyer');
  const heroImage = event.images?.find(img => img.imageType === 'hero');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-6xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription>
              {event.platform} - {event.externalId}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue='general' className='mt-4'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='general'>General</TabsTrigger>
              <TabsTrigger value='images'>Imágenes</TabsTrigger>
              <TabsTrigger value='ticketWaves'>
                Tandas de Tickets ({event.ticketWaves?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value='general'>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-4'
                >
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='name'
                      render={({field}) => (
                        <FormItem className='col-span-2'>
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
                        <FormItem className='col-span-2'>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

                    <FormField
                      control={form.control}
                      name='venueName'
                      render={({field}) => (
                        <FormItem>
                          <FormLabel>Nombre del Lugar</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='venueAddress'
                      render={({field}) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='externalUrl'
                      render={({field}) => (
                        <FormItem>
                          <FormLabel>URL Externa</FormLabel>
                          <FormControl>
                            <Input type='url' {...field} />
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
                            value={field.value}
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
                              <SelectItem value='3h'>3 horas antes</SelectItem>
                              <SelectItem value='6h'>6 horas antes</SelectItem>
                              <SelectItem value='12h'>
                                12 horas antes
                              </SelectItem>
                              <SelectItem value='24h'>
                                24 horas antes
                              </SelectItem>
                              <SelectItem value='48h'>
                                48 horas antes
                              </SelectItem>
                              <SelectItem value='72h'>
                                72 horas antes
                              </SelectItem>
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
                  </div>

                  <div className='flex justify-between pt-4'>
                    <Button
                      type='button'
                      variant='destructive'
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Eliminar Evento
                    </Button>
                    <div className='flex gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => onOpenChange(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type='submit' disabled={updateMutation.isPending}>
                        {updateMutation.isPending && (
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        )}
                        Guardar Cambios
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value='images'>
              <div className='space-y-6'>
                {/* Flyer Image */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Flyer</label>
                  <div className='flex items-start gap-4'>
                    {flyerImage ? (
                      <div className='relative'>
                        <img
                          src={flyerImage.url}
                          alt='Flyer'
                          className='h-40 w-auto rounded border object-cover'
                        />
                        <Button
                          variant='destructive'
                          size='icon'
                          className='absolute -right-2 -top-2 h-6 w-6'
                          onClick={() =>
                            deleteImageMutation.mutate({
                              eventId,
                              imageId: flyerImage.id,
                            })
                          }
                          disabled={deleteImageMutation.isPending}
                        >
                          <X className='h-3 w-3' />
                        </Button>
                      </div>
                    ) : (
                      <div className='flex h-40 w-32 items-center justify-center rounded border-2 border-dashed'>
                        <span className='text-sm text-muted-foreground'>
                          Sin imagen
                        </span>
                      </div>
                    )}
                    <div>
                      <label htmlFor='flyer-upload'>
                        <Button
                          variant='outline'
                          asChild
                          disabled={uploadImageMutation.isPending}
                        >
                          <span className='cursor-pointer'>
                            <Upload className='mr-2 h-4 w-4' />
                            {uploadImageMutation.isPending
                              ? 'Subiendo...'
                              : 'Subir Flyer'}
                          </span>
                        </Button>
                      </label>
                      <input
                        id='flyer-upload'
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={e => handleImageUpload(e, 'flyer')}
                      />
                    </div>
                  </div>
                </div>

                {/* Hero Image */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Hero</label>
                  <div className='flex items-start gap-4'>
                    {heroImage ? (
                      <div className='relative'>
                        <img
                          src={heroImage.url}
                          alt='Hero'
                          className='h-40 w-auto rounded border object-cover'
                        />
                        <Button
                          variant='destructive'
                          size='icon'
                          className='absolute -right-2 -top-2 h-6 w-6'
                          onClick={() =>
                            deleteImageMutation.mutate({
                              eventId,
                              imageId: heroImage.id,
                            })
                          }
                          disabled={deleteImageMutation.isPending}
                        >
                          <X className='h-3 w-3' />
                        </Button>
                      </div>
                    ) : (
                      <div className='flex h-40 w-32 items-center justify-center rounded border-2 border-dashed'>
                        <span className='text-sm text-muted-foreground'>
                          Sin imagen
                        </span>
                      </div>
                    )}
                    <div>
                      <label htmlFor='hero-upload'>
                        <Button
                          variant='outline'
                          asChild
                          disabled={uploadImageMutation.isPending}
                        >
                          <span className='cursor-pointer'>
                            <Upload className='mr-2 h-4 w-4' />
                            {uploadImageMutation.isPending
                              ? 'Subiendo...'
                              : 'Subir Hero'}
                          </span>
                        </Button>
                      </label>
                      <input
                        id='hero-upload'
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={e => handleImageUpload(e, 'hero')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Ticket Waves Tab */}
            <TabsContent value='ticketWaves'>
              <div className='space-y-4'>
                <div className='flex justify-end'>
                  <Button onClick={() => setCreatingWave(true)}>
                    <Plus className='mr-2 h-4 w-4' />
                    Nueva Tanda de Tickets
                  </Button>
                </div>

                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Valor Nominal</TableHead>
                        <TableHead>Moneda</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!event.ticketWaves || event.ticketWaves.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className='text-center'>
                            No hay tandas de tickets
                          </TableCell>
                        </TableRow>
                      ) : (
                        event.ticketWaves.map(wave => (
                          <TableRow key={wave.id}>
                            <TableCell>
                              <div>
                                <div className='font-medium'>{wave.name}</div>
                                {wave.description && (
                                  <div className='text-xs text-muted-foreground'>
                                    {wave.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{wave.faceValue}</TableCell>
                            <TableCell>{wave.currency}</TableCell>
                            <TableCell>
                              <div className='flex gap-1'>
                                {wave.isSoldOut && (
                                  <Badge variant='destructive'>Agotado</Badge>
                                )}
                                {!wave.isAvailable && (
                                  <Badge variant='secondary'>
                                    No disponible
                                  </Badge>
                                )}
                                {!wave.isSoldOut && wave.isAvailable && (
                                  <Badge variant='outline'>Disponible</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex gap-1'>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => setEditingWaveId(wave.id)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='text-destructive'
                                  onClick={() => handleDeleteWave(wave.id)}
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation */}
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

      {/* Delete Ticket Wave Confirmation */}
      <AlertDialog
        open={!!deletingWaveId}
        onOpenChange={(open: boolean) => !open && setDeletingWaveId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tanda de tickets?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteWave}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteWaveMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ticket Wave Edit/Create Dialog */}
      {(editingWaveId || creatingWave) && (
        <TicketWaveEditDialog
          eventId={eventId}
          waveId={editingWaveId}
          open={!!editingWaveId || creatingWave}
          onOpenChange={open => {
            if (!open) {
              setEditingWaveId(null);
              setCreatingWave(false);
            }
          }}
        />
      )}
    </>
  );
}

/**
 * Convert a UTC date string to a datetime-local input format in the user's local timezone
 */
function formatDateTimeLocal(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
