import {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {AlertCircle, X, RotateCcw, MessageCircle} from 'lucide-react';
import {IdentityVerificationFlow} from './IdentityVerificationFlow';

interface VerificationFailedProps {
  onComplete: () => void;
  rejectionReason?: string;
  canRetry?: boolean;
}

export function VerificationFailed({
  onComplete,
  rejectionReason,
  canRetry = true,
}: VerificationFailedProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showRetryFlow, setShowRetryFlow] = useState(false);

  const wasRejectedByAdmin = !!rejectionReason;

  // If dismissed, just show the retry flow
  if (isDismissed && canRetry) {
    return (
      <div className='container mx-auto max-w-2xl px-4 py-8'>
        <IdentityVerificationFlow onComplete={onComplete} />
      </div>
    );
  }

  // If showing retry flow
  if (showRetryFlow && canRetry) {
    return (
      <div className='container mx-auto max-w-2xl px-4 py-8'>
        <div className='mb-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowRetryFlow(false)}
            className='gap-2'
          >
            <X className='h-4 w-4' />
            Volver
          </Button>
        </div>
        <IdentityVerificationFlow onComplete={onComplete} />
      </div>
    );
  }

  return (
    <div className='container mx-auto max-w-2xl px-4 py-8'>
      <Card className='relative'>
        {/* Dismiss button */}
        {canRetry && (
          <Button
            variant='ghost'
            size='icon'
            className='absolute top-4 right-4'
            onClick={() => setIsDismissed(true)}
            aria-label='Cerrar'
          >
            <X className='h-4 w-4' />
          </Button>
        )}

        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <AlertCircle className='h-8 w-8 text-red-600' />
          </div>
          <CardTitle className='text-2xl'>
            {wasRejectedByAdmin
              ? 'Verificación rechazada'
              : 'Verificación fallida'}
          </CardTitle>
          <Badge variant='destructive' className='mx-auto mt-2'>
            No verificado
          </Badge>
        </CardHeader>

        <CardContent className='text-center space-y-4'>
          {wasRejectedByAdmin ? (
            <>
              <p className='text-muted-foreground'>
                Tu verificación fue revisada por nuestro equipo y no pudo ser
                aprobada.
              </p>
              <div className='bg-muted rounded-lg p-4 text-sm text-left'>
                <p className='font-medium mb-1'>Motivo del rechazo:</p>
                <p className='text-muted-foreground'>{rejectionReason}</p>
              </div>
              {canRetry && (
                <p className='text-sm text-muted-foreground'>
                  Podés intentar verificarte de nuevo con documentos e imágenes
                  más claras.
                </p>
              )}
            </>
          ) : (
            <p className='text-muted-foreground'>
              {canRetry
                ? 'Tu verificación anterior no fue exitosa. Podés intentar nuevamente o contactarnos si necesitás ayuda.'
                : 'Has agotado los intentos de verificación. Contactanos para resolver tu situación.'}
            </p>
          )}

          <div className='flex gap-3 justify-center pt-2'>
            <Button
              variant='outline'
              onClick={() =>
                (window.location.href =
                  'mailto:ayuda@revendiste.com?subject=Verificaci%C3%B3n%20de%20identidad%20' +
                  (wasRejectedByAdmin ? 'rechazada' : 'fallida'))
              }
              className='gap-2'
            >
              <MessageCircle className='h-4 w-4' />
              Contactar soporte
            </Button>

            {canRetry && (
              <Button onClick={() => setShowRetryFlow(true)} className='gap-2'>
                <RotateCcw className='h-4 w-4' />
                Intentar de nuevo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
