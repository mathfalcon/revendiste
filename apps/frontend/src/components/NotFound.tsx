import {Link, useRouter, useCanGoBack} from '@tanstack/react-router';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Home, ArrowLeft, TicketX} from 'lucide-react';

export function NotFound({children}: {children?: React.ReactNode}) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <div className='flex min-h-[calc(100vh-65px)] items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted'>
            <TicketX className='h-10 w-10 text-muted-foreground' />
          </div>
          <CardTitle className='text-4xl font-bold'>404</CardTitle>
          <CardDescription className='text-lg'>
            {children ?? 'La página que buscas no existe'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-center text-sm text-muted-foreground'>
            Es posible que la página haya sido movida o eliminada, o que la URL
            sea incorrecta.
          </p>
          <div className='flex flex-col gap-2 sm:flex-row'>
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
