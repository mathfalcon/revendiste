import {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
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
import {Badge} from '~/components/ui/badge';
import {createEventMutation} from '~/lib/api/admin';
import {VenueCombobox} from './VenueCombobox';
import {toast} from 'sonner';
import {Check, Loader2, Plus, X} from 'lucide-react';
import {cn} from '~/lib/utils';

const eventFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(),
  externalId: z.string().min(1, 'El ID externo es requerido'),
  platform: z.string().min(1, 'La plataforma es requerida'),
  eventStartDate: z.string().min(1, 'La fecha de inicio es requerida'),
  eventEndDate: z.string().min(1, 'La fecha de fin es requerida'),
  venueId: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  venueCity: z.string().optional(),
  externalUrl: z.string().optional(),
  qrAvailabilityTiming: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface TicketWave {
  id: string;
  name: string;
  description?: string | null;
  faceValue: number;
  currency: 'UYU' | 'USD';
}

interface EventCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLATFORMS = ['entraste', 'redtickets', 'tickantel'];
const QR_TIMINGS = ['3h', '6h', '12h', '24h', '48h', '72h'];

const STEPS = [
  {id: 0, label: 'Básico'},
  {id: 1, label: 'Lugar'},
  {id: 2, label: 'Tandas'},
  {id: 3, label: 'Finalizar'},
] as const;

export function EventCreateDialog({
  open,
  onOpenChange,
}: EventCreateDialogProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [waves, setWaves] = useState<TicketWave[]>([]);
  const [waveName, setWaveName] = useState('');
  const [waveValue, setWaveValue] = useState('');
  const [waveCurrency, setWaveCurrency] = useState<'UYU' | 'USD'>('UYU');
  const [selectedVenue, setSelectedVenue] = useState<
    {id: string; name: string; address: string; city: string} | undefined
  >();

  const form = useForm<EventFormValues>({
    resolver: standardSchemaResolver(eventFormSchema),
    defaultValues: {
      name: '',
      description: '',
      externalId: '',
      platform: '',
      eventStartDate: '',
      eventEndDate: '',
      venueId: '',
      venueName: '',
      venueAddress: '',
      venueCity: '',
      externalUrl: '',
      qrAvailabilityTiming: '',
      status: 'active',
    },
  });

  const mutation = useMutation({
    ...createEventMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'events']});
      toast.success('Evento creado exitosamente');
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear el evento');
    },
  });

  const resetForm = () => {
    form.reset();
    setWaves([]);
    setWaveName('');
    setWaveValue('');
    setWaveCurrency('UYU');
    setSelectedVenue(undefined);
    setCurrentStep(0);
  };

  const handleAddWave = () => {
    if (!waveName.trim() || !waveValue.trim()) {
      toast.error('Complete todos los campos de la tanda');
      return;
    }

    const newWave: TicketWave = {
      id: Math.random().toString(),
      name: waveName,
      faceValue: parseFloat(waveValue),
      currency: waveCurrency,
    };

    setWaves([...waves, newWave]);
    setWaveName('');
    setWaveValue('');
    setWaveCurrency('UYU');
  };

  const handleRemoveWave = (id: string) => {
    setWaves(waves.filter(w => w.id !== id));
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      const isValid = await form.trigger([
        'name',
        'externalId',
        'platform',
        'eventStartDate',
        'eventEndDate',
      ]);
      if (isValid) setCurrentStep(1);
    } else if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = async (data: EventFormValues) => {
    mutation.mutate({
      name: data.name,
      description: data.description || null,
      externalId: data.externalId,
      platform: data.platform,
      eventStartDate: new Date(data.eventStartDate).toISOString(),
      eventEndDate: new Date(data.eventEndDate).toISOString(),
      venueId: selectedVenue?.id,
      venueName: selectedVenue?.name || data.venueName,
      venueAddress: selectedVenue?.address || data.venueAddress,
      venueCity: selectedVenue?.city || data.venueCity,
      externalUrl: data.externalUrl || '',
      qrAvailabilityTiming: data.qrAvailabilityTiming
        ? (data.qrAvailabilityTiming as any)
        : null,
      status: data.status,
      ticketWaves: waves.map(w => ({
        name: w.name,
        faceValue: w.faceValue,
        currency: w.currency,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Evento</DialogTitle>
          <DialogDescription>
            Completa los detalles del evento. Puedes agregar imágenes después de
            crearlo.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className='flex items-center justify-between mb-2'>
          {STEPS.map((step, idx) => (
            <div key={step.id} className='flex items-center flex-1'>
              <div className='flex flex-col items-center'>
                <button
                  type='button'
                  onClick={() => idx < currentStep && setCurrentStep(idx)}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                    idx < currentStep
                      ? 'bg-primary border-primary text-primary-foreground cursor-pointer'
                      : idx === currentStep
                        ? 'border-primary text-primary bg-background'
                        : 'border-muted-foreground/30 text-muted-foreground/50 bg-background cursor-default',
                  )}
                >
                  {idx < currentStep ? <Check className='h-4 w-4' /> : idx + 1}
                </button>
                <span
                  className={cn(
                    'text-xs mt-1 font-medium',
                    idx === currentStep
                      ? 'text-primary'
                      : idx < currentStep
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground/50',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 mb-5 transition-colors',
                    idx < currentStep ? 'bg-primary' : 'bg-muted-foreground/20',
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-6'
          >
            {/* Step 0: Basic Info */}
            {currentStep === 0 && (
              <div className='space-y-4'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Nombre del Evento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Ej: Concierto de Rock 2025'
                          {...field}
                        />
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
                          placeholder='Descripción del evento'
                          rows={3}
                          {...field}
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
                    name='externalId'
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>ID Externo</FormLabel>
                        <FormControl>
                          <Input placeholder='Ej: EVT-123456' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='platform'
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Plataforma</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Seleccionar...' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PLATFORMS.map(p => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='eventStartDate'
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Fecha Inicio</FormLabel>
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
                        <FormLabel>Fecha Fin</FormLabel>
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
                          placeholder='https://ejemplo.com/evento'
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 1: Venue */}
            {currentStep === 1 && (
              <div className='space-y-4'>
                <div>
                  <h3 className='font-semibold mb-3'>Buscar Lugar Existente</h3>
                  <VenueCombobox
                    value={selectedVenue?.id}
                    onValueChange={(id, venue) => setSelectedVenue(venue)}
                    placeholder='O crea uno nuevo abajo'
                  />
                </div>

                <div className='border-t pt-4'>
                  <h3 className='font-semibold mb-3'>Crear Lugar Nuevo</h3>

                  <FormField
                    control={form.control}
                    name='venueName'
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Nombre del Lugar</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Ej: Antel Arena'
                            {...field}
                            value={field.value || ''}
                            disabled={!!selectedVenue}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-2 gap-4 mt-4'>
                    <FormField
                      control={form.control}
                      name='venueAddress'
                      render={({field}) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Ej: Av. Italia 3000'
                              {...field}
                              value={field.value || ''}
                              disabled={!!selectedVenue}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='venueCity'
                      render={({field}) => (
                        <FormItem>
                          <FormLabel>Ciudad</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Ej: Montevideo'
                              {...field}
                              value={field.value || ''}
                              disabled={!!selectedVenue}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Ticket Waves */}
            {currentStep === 2 && (
              <div className='space-y-4'>
                <div className='space-y-3'>
                  <h3 className='font-semibold'>Agregar Tandas de Entradas</h3>

                  <div className='grid grid-cols-2 gap-2'>
                    <Input
                      placeholder='Nombre de la tanda'
                      value={waveName}
                      onChange={e => setWaveName(e.target.value)}
                    />
                    <Input
                      type='number'
                      placeholder='Valor nominal'
                      step='0.01'
                      value={waveValue}
                      onChange={e => setWaveValue(e.target.value)}
                    />
                  </div>

                  <div className='flex gap-2'>
                    <Select
                      value={waveCurrency}
                      onValueChange={(val: any) => setWaveCurrency(val)}
                    >
                      <SelectTrigger className='w-32'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='UYU'>UYU</SelectItem>
                        <SelectItem value='USD'>USD</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type='button'
                      onClick={handleAddWave}
                      variant='outline'
                      className='flex-1'
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Agregar Tanda
                    </Button>
                  </div>
                </div>

                {waves.length > 0 && (
                  <div className='border rounded-lg p-3 space-y-2'>
                    {waves.map(wave => (
                      <div
                        key={wave.id}
                        className='flex items-center justify-between p-2 bg-muted rounded'
                      >
                        <div>
                          <div className='font-medium text-sm'>{wave.name}</div>
                          <div className='text-xs text-muted-foreground'>
                            ${wave.faceValue.toFixed(2)} {wave.currency}
                          </div>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => handleRemoveWave(wave.id)}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name='qrAvailabilityTiming'
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Disponibilidad de QR</FormLabel>
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
                          <SelectItem value='none'>Sin restricción</SelectItem>
                          {QR_TIMINGS.map(t => (
                            <SelectItem key={t} value={t}>
                              {t} antes del evento
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Confirm */}
            {currentStep === 3 && (
              <div className='space-y-4'>
                <div className='bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
                  <h3 className='font-semibold mb-2 text-blue-900 dark:text-blue-100'>
                    ¡Casi listo!
                  </h3>
                  <p className='text-sm text-blue-800 dark:text-blue-200 mb-3'>
                    El evento se creará con los datos ingresados. Podrás agregar
                    y editar imágenes después de crearlo desde la página de
                    detalles.
                  </p>

                  <FormField
                    control={form.control}
                    name='status'
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Estado Inicial</FormLabel>
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

                <div className='bg-slate-50 dark:bg-slate-900 border rounded-lg p-4 space-y-2'>
                  <h4 className='font-semibold text-sm'>Resumen</h4>
                  <div className='text-sm space-y-1.5'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Evento</span>
                      <span className='font-medium text-right max-w-[60%] truncate'>
                        {form.getValues('name')}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Plataforma</span>
                      <Badge variant='outline' className='text-xs'>
                        {form.getValues('platform')}
                      </Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Tandas de entradas
                      </span>
                      <span className='font-medium'>{waves.length}</span>
                    </div>
                    {selectedVenue && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Lugar</span>
                        <span className='font-medium'>
                          {selectedVenue.name}
                        </span>
                      </div>
                    )}
                    {form.getValues('venueName') && !selectedVenue && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                          Lugar (nuevo)
                        </span>
                        <span className='font-medium'>
                          {form.getValues('venueName')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className='flex justify-between gap-2 pt-2'>
              {currentStep > 0 ? (
                <Button type='button' variant='outline' onClick={handleBack}>
                  Atrás
                </Button>
              ) : (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
              )}

              {currentStep < STEPS.length - 1 ? (
                <Button type='button' onClick={handleNext}>
                  Siguiente
                </Button>
              ) : (
                <Button type='submit' disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  Crear Evento
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
