import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';
import posthog from 'posthog-js';
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
import {cancelOrderMutation} from '~/lib/api/order';

interface CancelOrderDialogProps {
  orderId: string;
  eventId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelOrderDialog({
  orderId,
  eventId,
  open,
  onOpenChange,
}: CancelOrderDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    ...cancelOrderMutation(orderId),
    onSuccess: () => {
      posthog.capture('checkout_abandoned', {
        order_id: orderId,
        event_id: eventId,
      });
      // Invalidate related queries
      queryClient.invalidateQueries({queryKey: ['orders']});

      // If we have an eventId, also invalidate the event query to refresh ticket availability
      if (eventId) {
        queryClient.invalidateQueries({queryKey: ['events', eventId]});
      }

      onOpenChange(false);

      // Navigate back to the event page if we have an eventId
      if (eventId) {
        navigate({
          to: '/eventos/$eventId',
          params: {eventId},
        });
      }
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar orden?</AlertDialogTitle>
          <AlertDialogDescription className='space-y-2'>
            <p>
              Esta acción liberará las entradas reservadas y no podrás
              recuperarlas. Las entradas volverán a estar disponibles para otros
              compradores.
            </p>
            <p className='font-medium text-foreground'>
              ¿Estás seguro de que deseas cancelar esta orden?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Volver
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              e.preventDefault();
              mutation.mutate();
            }}
            disabled={mutation.isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {mutation.isPending ? 'Cancelando...' : 'Sí, cancelar orden'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
