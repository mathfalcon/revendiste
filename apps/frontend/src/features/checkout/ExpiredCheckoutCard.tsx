import {Link} from '@tanstack/react-router';
import {ClockIcon, Loader2, AlertTriangle} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {CancelOrderDialog} from '~/components';

type Variant = 'released' | 'pendingPayment' | 'expired' | 'cancelled';

interface ExpiredCheckoutCardProps {
  orderId: string;
  eventSlug?: string | null;
  /**
   * - `released`: timer ran out and there was no payment attempt; reservation already returned to inventory (or about to be).
   * - `pendingPayment`: timer ran out but a non-terminal payment exists; we are waiting for the provider.
   * - `expired`: the order itself is in `expired` status (server-confirmed).
   * - `cancelled`: the order was cancelled (server-confirmed).
   */
  variant: Variant;
  /** True while we are auto-refreshing the order status (variant `pendingPayment`). */
  isRefreshing?: boolean;
  /** Open state for the cancel-order dialog, controlled by parent. */
  cancelDialogOpen: boolean;
  onCancelDialogOpenChange: (open: boolean) => void;
}

const COPY: Record<
  Variant,
  {
    title: string;
    description: string;
    icon: 'clock' | 'spinner' | 'warning';
    tone: 'destructive' | 'warning' | 'muted';
  }
> = {
  released: {
    title: 'Se liberó tu reserva',
    description:
      'Se cumplió el tiempo para completar el pago. Para seguir, creá una nueva orden desde la página del evento.',
    icon: 'clock',
    tone: 'destructive',
  },
  pendingPayment: {
    title: 'Estamos confirmando tu pago',
    description:
      'El tiempo de la reserva se cumplió, pero todavía esperamos la confirmación de la procesadora de pagos. Esto puede tardar unos minutos. Esta página se actualiza sola.',
    icon: 'spinner',
    tone: 'warning',
  },
  expired: {
    title: 'Esta orden expiró',
    description:
      'Se cumplió el tiempo para completar el pago. Para seguir, creá una nueva orden desde la página del evento.',
    icon: 'clock',
    tone: 'destructive',
  },
  cancelled: {
    title: 'Esta orden fue cancelada',
    description:
      'Esta orden ya no está activa. Si querés comprar, creá una nueva orden desde la página del evento.',
    icon: 'warning',
    tone: 'muted',
  },
};

export function ExpiredCheckoutCard({
  orderId,
  eventSlug,
  variant,
  isRefreshing = false,
  cancelDialogOpen,
  onCancelDialogOpenChange,
}: ExpiredCheckoutCardProps) {
  const copy = COPY[variant];
  const showCancelEscape = variant === 'pendingPayment';

  return (
    <>
      <section
        role={variant === 'pendingPayment' ? 'status' : 'alert'}
        aria-live={variant === 'pendingPayment' ? 'polite' : 'assertive'}
        className='rounded-lg border bg-card p-6 sm:p-8 text-center space-y-5'
      >
        <div className='flex justify-center'>
          <IconBadge icon={copy.icon} tone={copy.tone} />
        </div>

        <div className='space-y-2'>
          <h2 className='text-xl sm:text-2xl font-semibold'>{copy.title}</h2>
          <p className='text-sm sm:text-base text-muted-foreground max-w-prose mx-auto'>
            {copy.description}
          </p>
        </div>

        {variant === 'pendingPayment' && (
          <p
            className='inline-flex items-center justify-center gap-2 text-xs text-muted-foreground'
            aria-live='polite'
          >
            <Loader2
              className={`h-3.5 w-3.5 ${
                isRefreshing ? 'animate-spin' : 'opacity-50'
              }`}
              aria-hidden='true'
            />
            <span>
              {isRefreshing
                ? 'Actualizando estado...'
                : 'Buscamos novedades cada pocos segundos.'}
            </span>
          </p>
        )}

        <div className='flex flex-col sm:flex-row gap-3 justify-center pt-1'>
          {eventSlug && (
            <Button asChild size='lg' className='bg-primary-gradient'>
              <Link
                to='/eventos/$slug'
                params={{slug: eventSlug}}
                preloadDelay={0}
              >
                Volver al evento
              </Link>
            </Button>
          )}
          <Button asChild variant='ghost' size='lg'>
            <Link to='/cuenta/entradas'>Ir a mis entradas</Link>
          </Button>
        </div>

        {showCancelEscape && (
          <div className='pt-3 border-t border-border/60'>
            <p className='text-xs text-muted-foreground'>¿Cambiaste de idea?</p>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => onCancelDialogOpenChange(true)}
              className='text-muted-foreground hover:text-destructive'
            >
              Cancelar la orden y empezar de nuevo
            </Button>
          </div>
        )}
      </section>

      <CancelOrderDialog
        orderId={orderId}
        eventSlug={eventSlug ?? undefined}
        open={cancelDialogOpen}
        onOpenChange={onCancelDialogOpenChange}
      />
    </>
  );
}

function IconBadge({
  icon,
  tone,
}: {
  icon: 'clock' | 'spinner' | 'warning';
  tone: 'destructive' | 'warning' | 'muted';
}) {
  const toneClasses =
    tone === 'destructive'
      ? 'bg-destructive/10 text-destructive'
      : tone === 'warning'
        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
        : 'bg-muted text-muted-foreground';

  const Icon =
    icon === 'spinner'
      ? Loader2
      : icon === 'warning'
        ? AlertTriangle
        : ClockIcon;
  const iconClasses = `h-8 w-8 ${icon === 'spinner' ? 'animate-spin' : ''}`;

  return (
    <div className={`rounded-full p-3 ${toneClasses}`} aria-hidden='true'>
      <Icon className={iconClasses} />
    </div>
  );
}
