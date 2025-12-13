import {useState} from 'react';
import {Link, useRouter, useCanGoBack} from '@tanstack/react-router';
import type {ErrorComponentProps} from '@tanstack/react-router';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Home, ArrowLeft, AlertCircle, RotateCw} from 'lucide-react';

export function DefaultCatchBoundary({error, reset}: ErrorComponentProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const [isRetrying, setIsRetrying] = useState(false);

  // Log the full error details for debugging
  console.error('Error caught by DefaultCatchBoundary:', error);

  // Show a friendly message to the user instead of raw error details
  // Tone: casual, youth-oriented for Uruguayan audience
  const friendlyMessage = 'No te preocupes, probá de nuevo o volvé atrás.';

  return (
    <div className='flex min-h-[calc(100vh-65px)] items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10'>
            <AlertCircle className='h-10 w-10 text-destructive' />
          </div>
          <CardTitle className='text-4xl font-bold'>Error</CardTitle>
          <CardDescription className='text-lg'>Algo salió mal</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-center text-sm text-muted-foreground'>
            {friendlyMessage}
          </p>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <Button
              variant='outline'
              className='flex-1'
              disabled={isRetrying}
              onClick={async () => {
                setIsRetrying(true);
                try {
                  // Use router.invalidate() for route load errors (recommended by TanStack Router)
                  // This coordinates both a router reload and error boundary reset
                  await router.invalidate();
                  // Also call reset if available for component-level errors
                  reset?.();
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.error('Error during retry:', err);
                } finally {
                  setIsRetrying(false);
                }
              }}
            >
              <RotateCw
                className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`}
              />
              {isRetrying ? 'Intentando...' : 'Intentar de nuevo'}
            </Button>
            {canGoBack && (
              <Button
                variant='outline'
                className='flex-1'
                onClick={() => router.history.back()}
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Volver
              </Button>
            )}
            <Button asChild className={canGoBack ? 'flex-1' : 'w-full'}>
              <Link to='/'>
                <Home className='mr-2 h-4 w-4' />
                Ir al inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
