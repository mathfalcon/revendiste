import {Link} from '@tanstack/react-router';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Home, CalendarX} from 'lucide-react';

export function EventEnded() {
  return (
    <div className='flex min-h-[calc(100vh-65px)] items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted'>
            <CalendarX className='h-10 w-10 text-muted-foreground' />
          </div>
          <CardTitle className='text-2xl font-bold'>
            El evento ya finalizó
          </CardTitle>
          <CardDescription className='text-lg'>
            Pero puedes ver nuevos eventos
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-center text-sm text-muted-foreground'>
            Este evento ya terminó, pero tenemos muchos otros eventos disponibles
            para ti.
          </p>
          <Button asChild className='w-full'>
            <Link to='/'>
              <Home className='mr-2 h-4 w-4' />
              Ver eventos disponibles
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

