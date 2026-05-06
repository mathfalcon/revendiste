import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';
import {ANALYTICS_EVENTS, trackEvent} from '~/lib/analytics';
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
  eventSlug?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelOrderDialog({
  orderId,
  eventSlug,
  open,
  onOpenChange,
}: CancelOrderDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    ...cancelOrderMutation(orderId),
    onSuccess: () => {
      trackEvent(ANALYTICS_EVENTS.CHECKOUT_ABANDONED, {
        order_id: orderId,
        event_slug: eventSlug,
      });
      // Invalidate related queries
      queryClient.invalidateQueries({queryKey: ['orders']});

      // If we have a slug, also invalidate the event query to refresh ticket availability
      if (eventSlug) {
        queryClient.invalidateQueries({
          queryKey: ['events', 'slug', eventSlug],
        });
      }

      onOpenChange(false);

      // Navigate back to the event page if we have a slug
      if (eventSlug) {
        navigate({
          to: '/eventos/$slug',
          params: {slug: eventSlug},
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
