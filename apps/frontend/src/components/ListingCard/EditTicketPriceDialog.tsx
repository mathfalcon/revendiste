import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import z from 'zod';
import {useEffect} from 'react';
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
import {Input} from '~/components/ui/input';
import {Button} from '~/components/ui/button';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  updateTicketPriceMutation,
  getMyListingsQuery,
} from '~/lib/api/ticket-listings';
import {formatPrice, getCurrencySymbol} from '~/utils';
import type {EventTicketCurrency} from '~/lib/api/generated';

const editTicketPriceSchema = z
  .object({
    price: z.number().min(1, 'El precio debe ser mayor a 0'),
    maxPrice: z.number(),
  })
  .superRefine((data, ctx) => {
    if (data.price > data.maxPrice) {
      ctx.addIssue({
        code: 'custom',
        message: `El precio no puede superar al precio original de la tanda ($${data.maxPrice.toLocaleString('es-ES')})`,
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
    resolver: zodResolver(editTicketPriceSchema),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar precio</DialogTitle>
          <DialogDescription>
            Actualiza el precio de tu ticket. El precio no puede superar el
            valor nominal de {getCurrencySymbol(currency)}
            {maxPrice.toLocaleString('es-ES')}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='price'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.01'
                      min='1'
                      {...field}
                      onChange={e => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          field.onChange(value);
                        } else if (e.target.value === '') {
                          field.onChange(0);
                        }
                      }}
                      value={field.value || ''}
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
