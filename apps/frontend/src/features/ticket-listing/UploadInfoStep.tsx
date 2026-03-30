import {Button} from '~/components/ui/button';
import {
  ArrowLeft,
  Clock,
  Upload,
  Bell,
  AlertCircle,
} from 'lucide-react';
import type {QrAvailabilityTiming} from '~/lib/api/generated';
import {QR_TIMING_LABELS} from '~/features/event/QrAvailabilityDialog';

interface UploadInfoStepProps {
  qrAvailabilityTiming: QrAvailabilityTiming;
  onBack: () => void;
  onPublish: () => void;
  isPublishing: boolean;
}

export function UploadInfoStep({
  qrAvailabilityTiming,
  onBack,
  onPublish,
  isPublishing,
}: UploadInfoStepProps) {
  const timingLabel = QR_TIMING_LABELS[qrAvailabilityTiming];

  return (
    <div className='space-y-6'>
      {/* Back link */}
      <button
        type='button'
        onClick={onBack}
        className='flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
      >
        <ArrowLeft className='h-4 w-4' />
        Volver al formulario
      </button>

      {/* Header */}
      <div className='flex flex-col items-center text-center space-y-3'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
          <Clock className='h-6 w-6 text-muted-foreground' />
        </div>
        <div>
          <h2 className='text-xl font-bold'>
            Todavía no necesitás subir los documentos
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Los QR de este evento se generan {timingLabel} antes del inicio.
            Cuando llegue el momento, te vamos a pedir que los subas.
          </p>
        </div>
      </div>

      {/* Info items — reusing the seller-mode content from QrAvailabilityDialog */}
      <div className='space-y-3 rounded-lg border bg-muted/20 p-4'>
        <div className='flex items-start gap-3'>
          <Upload className='mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400' />
          <p className='text-sm text-muted-foreground'>
            <span className='font-medium text-foreground'>
              Subida obligatoria.
            </span>{' '}
            Vas a tener que subir el QR o PDF de cada entrada {timingLabel} antes
            del evento como máximo.
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <Bell className='mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400' />
          <p className='text-sm text-muted-foreground'>
            <span className='font-medium text-foreground'>
              Te avisamos.
            </span>{' '}
            Te vamos a notificar cuando sea momento de subir los documentos.
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <AlertCircle className='mt-0.5 h-5 w-5 shrink-0 text-orange-500' />
          <p className='text-sm text-muted-foreground'>
            <span className='font-medium text-foreground'>
              Importante.
            </span>{' '}
            Si no subís los documentos a tiempo, la venta se cancela
            automáticamente.
          </p>
        </div>
      </div>

      {/* Publish button */}
      <Button
        onClick={onPublish}
        disabled={isPublishing}
        className='w-full'
      >
        {isPublishing ? (
          <>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2' />
            Publicando...
          </>
        ) : (
          'Entendido, publicar entradas'
        )}
      </Button>
    </div>
  );
}
