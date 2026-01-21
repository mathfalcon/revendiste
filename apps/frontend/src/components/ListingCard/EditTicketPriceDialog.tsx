import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import z from 'zod';
import {useEffect, useRef, useCallback} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {Button} from '~/components/ui/button';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  updateTicketPriceMutation,
  getMyListingsQuery,
} from '~/lib/api/ticket-listings';
import {formatPrice, formatAmount} from '~/utils';
import type {EventTicketCurrency} from '~/lib/api/generated';
import {PriceInput} from '~/components/ui/price-input';
import {toast} from 'sonner';
import {Link} from '@tanstack/react-router';

const editTicketPriceSchema = z
  .object({
    price: z.number().min(1, 'El precio debe ser mayor a 0'),
    maxPrice: z.number(),
  })
  .superRefine((data, ctx) => {
    if (data.price > data.maxPrice) {
      ctx.addIssue({
        code: 'custom',
        message: `El precio máximo es $${formatAmount(data.maxPrice)}`,
        path: ['price'],
      });
    }
  });

type EditTicketPriceFormValues = z.infer<typeof editTicketPriceSchema>;

interface EditTicketPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  currentPrice: number;
  maxPrice: number;
  currency: EventTicketCurrency;
}

export function EditTicketPriceDialog({
  open,
  onOpenChange,
  ticketId,
  currentPrice,
  maxPrice,
  currency,
}: EditTicketPriceDialogProps) {
  const queryClient = useQueryClient();
  const updatePriceMutation = useMutation(updateTicketPriceMutation(ticketId));

  const form = useForm<EditTicketPriceFormValues>({
    resolver: standardSchemaResolver(editTicketPriceSchema),
    defaultValues: {
      price: currentPrice,
      maxPrice,
    },
  });

  // Reset form when dialog opens with new ticket
  useEffect(() => {
    if (open) {
      form.reset({
        price: currentPrice,
        maxPrice,
      });
    }
  }, [open, currentPrice, maxPrice, form]);

  const onSubmit = async (data: EditTicketPriceFormValues) => {
    try {
      await updatePriceMutation.mutateAsync({price: data.price});
      await queryClient.invalidateQueries({
        queryKey: getMyListingsQuery().queryKey,
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by mutation's onError
    }
  };

  // Throttle toast to avoid spamming when user repeatedly exceeds max
  const lastToastTimeRef = useRef<number>(0);
  const showMaxExceededToast = useCallback(() => {
    const now = Date.now();
    if (now - lastToastTimeRef.current > 2000) {
      lastToastTimeRef.current = now;
      toast.info(`El precio máximo es ${formatPrice(maxPrice, currency)}`);
    }
  }, [maxPrice, currency]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar precio</DialogTitle>
          <DialogDescription className='space-y-1'>
            <span className='block'>Actualizá el precio de tu entrada.</span>
            <span className='block'>
              Máximo: {formatPrice(maxPrice, currency)}.{' '}
              <Link
                to='/preguntas-frecuentes'
                search={{seccion: 'general', pregunta: 2}}
                className='text-primary hover:underline'
                target='_blank'
              >
                ¿Por qué?
              </Link>
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='price'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Nuevo precio</FormLabel>
                  <FormControl>
                    <PriceInput
                      placeholder='Ingresá el precio'
                      value={field.value}
                      onChange={field.onChange}
                      locale='es-ES'
                      currency={currency}
                      max={maxPrice}
                      onMaxExceeded={showMaxExceededToast}
                    />
                  </FormControl>
                  <FormDescription>
                    Precio actual: {formatPrice(currentPrice, currency)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={updatePriceMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={updatePriceMutation.isPending}>
                {updatePriceMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
