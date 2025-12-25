import {useState} from 'react';
import {
  Link,
  useRouter,
  useCanGoBack,
  isNotFound,
} from '@tanstack/react-router';
import type {ErrorComponentProps} from '@tanstack/react-router';
import {isAxiosError} from 'axios';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Home, ArrowLeft, AlertCircle, RotateCw} from 'lucide-react';
import {NotFound} from './NotFound';

export function DefaultCatchBoundary({error, reset}: ErrorComponentProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const [isRetrying, setIsRetrying] = useState(false);

  // Log the full error details for debugging
  console.error('Error caught by DefaultCatchBoundary:', error);

  // Check if the error is a 404 (TanStack Router NotFoundError or AxiosError with status 404)
  const is404Error = (() => {
    // Check for TanStack Router NotFoundError
    if (isNotFound(error)) {
      return true;
    }

    // Check for AxiosError with status 404
    if (isAxiosError(error) && error.response?.status === 404) {
      return true;
    }

    // Check for errors with status property
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as {status: unknown}).status === 404
    ) {
      return true;
    }

    // Check for errors with statusCode property
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      (error as {statusCode: unknown}).statusCode === 404
    ) {
      return true;
    }

    return false;
  })();

  // If it's a 404 error, render the NotFound component
  if (is404Error) {
    return <NotFound />;
  }

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
          <div className='flex flex-col gap-2 sm:flex-row flex-wrap'>
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
