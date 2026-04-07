import {Link} from '@tanstack/react-router';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {
  ShieldCheck,
  Clock,
  Bell,
  CheckCircle2,
  Upload,
  AlertCircle,
} from 'lucide-react';
import type {QrAvailabilityTiming} from '~/lib/api/generated';

interface QrAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrAvailabilityTiming: QrAvailabilityTiming;
  /** 'buyer' shows purchase-focused content, 'seller' shows upload obligations */
  viewMode?: 'buyer' | 'seller';
}

export const QR_TIMING_LABELS: Record<QrAvailabilityTiming, string> = {
  '3h': '3 horas',
  '6h': '6 horas',
  '12h': '12 horas',
  '24h': '24 horas',
  '48h': '48 horas',
  '72h': '72 horas',
};

export function QrAvailabilityDialog({
  open,
  onOpenChange,
  qrAvailabilityTiming,
  viewMode = 'buyer',
}: QrAvailabilityDialogProps) {
  const timingLabel = QR_TIMING_LABELS[qrAvailabilityTiming];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader className='space-y-3'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
            <Clock className='h-6 w-6 text-muted-foreground' />
          </div>
          <DialogTitle className='text-center'>
            QRs disponibles {timingLabel} antes
          </DialogTitle>
          <DialogDescription className='text-center'>
            {viewMode === 'buyer'
              ? 'El organizador genera los códigos QR cerca del inicio del evento.'
              : 'Podrás subir el QR de tu entrada cuando el organizador lo genere.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 pt-2'>
          {viewMode === 'buyer' ? (
            <>
              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400' />
                <p className='text-sm text-muted-foreground'>
                  <span className='font-medium text-foreground'>
                    Puedes comprar ahora.
                  </span>{' '}
                  Recibirás el QR cuando esté disponible.
                </p>
              </div>

              <div className='flex items-start gap-3'>
                <Bell className='mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400' />
                <p className='text-sm text-muted-foreground'>
                  <span className='font-medium text-foreground'>
                    Te avisamos.
                  </span>{' '}
                  Te notificaremos cuando el vendedor suba el QR.
                </p>
              </div>

              <div className='flex items-start gap-3'>
                <ShieldCheck className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                <p className='text-sm text-muted-foreground'>
                  <span className='font-medium text-foreground'>
                    Dinero protegido.
                  </span>{' '}
                  Nuestra garantía te protege si no recibes el QR.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className='flex items-start gap-3'>
                <Upload className='mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400' />
                <p className='text-sm text-muted-foreground'>
                  <span className='font-medium text-foreground'>
                    Subida obligatoria.
                  </span>{' '}
                  Deberás subir el QR {timingLabel} antes del evento como
                  máximo.
                </p>
              </div>

              <div className='flex items-start gap-3'>
                <Bell className='mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400' />
                <p className='text-sm text-muted-foreground'>
                  <span className='font-medium text-foreground'>
                    Te recordamos.
                  </span>{' '}
                  Te notificaremos cuando sea momento de subir el QR.
                </p>
              </div>

              <div className='flex items-start gap-3'>
                <AlertCircle className='mt-0.5 h-5 w-5 shrink-0 text-orange-500' />
                <p className='text-sm text-muted-foreground'>
                  <span className='font-medium text-foreground'>
                    Importante.
                  </span>{' '}
                  Si no subes el QR a tiempo, la venta será cancelada.
                </p>
              </div>
            </>
          )}
        </div>

        <div className='flex flex-col gap-2 pt-4'>
          <Button onClick={() => onOpenChange(false)} className='w-full'>
            Entendido
          </Button>
          {viewMode === 'buyer' && (
            <Button asChild variant='ghost' size='sm' className='w-full'>
              <Link to='/garantia' className='text-muted-foreground'>
                Más sobre la Garantía
              </Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
