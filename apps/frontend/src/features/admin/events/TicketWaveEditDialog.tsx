import {useEffect} from 'react';
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
import {Switch} from '~/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {
  adminEventDetailsQueryOptions,
  createTicketWaveMutation,
  updateTicketWaveMutation,
} from '~/lib/api/admin';
import {toast} from 'sonner';
import {Loader2} from 'lucide-react';

// Form schema
const ticketWaveFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  faceValue: z.coerce.number().min(0, 'El valor debe ser mayor o igual a 0'),
  currency: z.enum(['UYU', 'USD']),
  isSoldOut: z.boolean(),
  isAvailable: z.boolean(),
});

type TicketWaveFormValues = z.infer<typeof ticketWaveFormSchema>;

interface TicketWaveEditDialogProps {
  eventId: string;
  waveId: string | null; // null for create mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketWaveEditDialog({
  eventId,
  waveId,
  open,
  onOpenChange,
}: TicketWaveEditDialogProps) {
  const queryClient = useQueryClient();
  const isCreateMode = !waveId;

  const {data: event} = useQuery(adminEventDetailsQueryOptions(eventId));

  // Get the wave data if editing
  const wave = waveId ? event?.ticketWaves?.find(w => w.id === waveId) : null;

  // Form setup
  const form = useForm<TicketWaveFormValues>({
    resolver: standardSchemaResolver(ticketWaveFormSchema),
    defaultValues: {
      name: '',
      description: '',
      faceValue: 0,
      currency: 'UYU',
      isSoldOut: false,
      isAvailable: true,
    },
  });

  // Initialize form when wave data is available or reset for create mode
  useEffect(() => {
    if (wave) {
      form.reset({
        name: wave.name,
        description: wave.description || '',
        faceValue: Number(wave.faceValue),
        currency: wave.currency as 'UYU' | 'USD',
        isSoldOut: wave.isSoldOut,
        isAvailable: wave.isAvailable,
      });
    } else if (isCreateMode) {
      form.reset({
        name: '',
        description: '',
        faceValue: 0,
        currency: 'UYU',
        isSoldOut: false,
        isAvailable: true,
      });
    }
  }, [wave, isCreateMode, form]);

  const createMutation = useMutation({
    ...createTicketWaveMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'events', eventId]});
      toast.success('Tanda de entradas creada');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al crear la tanda de tickets',
      );
    },
  });

  const updateMutation = useMutation({
    ...updateTicketWaveMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'events', eventId]});
      toast.success('Tanda de entradas actualizada');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          'Error al actualizar la tanda de tickets',
      );
    },
  });

  const onSubmit = (data: TicketWaveFormValues) => {
    if (isCreateMode) {
      createMutation.mutate({
        eventId,
        data: {
          name: data.name,
          description: data.description || null,
          faceValue: data.faceValue,
          currency: data.currency,
          isSoldOut: data.isSoldOut,
          isAvailable: data.isAvailable,
        },
      });
    } else {
      updateMutation.mutate({
        eventId,
        waveId: waveId!,
        data: {
          name: data.name,
          description: data.description || null,
          faceValue: data.faceValue,
          currency: data.currency,
          isSoldOut: data.isSoldOut,
          isAvailable: data.isAvailable,
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCreateMode ? 'Nueva Tanda de Entradas' : 'Editar Tanda de Entradas'}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? 'Crea una nueva tanda de entradas para este evento'
              : 'Actualiza la información de la tanda de entradas'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='Ej: General, VIP, Early Bird'
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
                      {...field}
                      placeholder='Descripción opcional'
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='faceValue'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Valor Nominal</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        min='0'
                        placeholder='0.00'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='currency'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='UYU'>UYU</SelectItem>
                        <SelectItem value='USD'>USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='space-y-4 rounded-lg border p-4'>
              <FormField
                control={form.control}
                name='isAvailable'
                render={({field}) => (
                  <FormItem className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <FormLabel>Disponible</FormLabel>
                      <FormDescription>
                        ¿Esta tanda de tickets está disponible para la venta?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='isSoldOut'
                render={({field}) => (
                  <FormItem className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <FormLabel>Agotado</FormLabel>
                      <FormDescription>
                        ¿Está agotada esta tanda de tickets?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className='flex justify-end gap-2 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isCreateMode ? 'Crear' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
