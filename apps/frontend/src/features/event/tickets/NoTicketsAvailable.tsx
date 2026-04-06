import {Link, useNavigate} from '@tanstack/react-router';
import {Button} from '~/components/ui/button';
import {Card, CardContent} from '~/components/ui/card';
import {TicketX, Ticket} from 'lucide-react';

interface NoTicketsAvailableProps {
  eventId: string;
  userListingsCount?: number;
}

export function NoTicketsAvailable({
  eventId,
  userListingsCount = 0,
}: NoTicketsAvailableProps) {
  const navigate = useNavigate();
  const hasOwnListings = userListingsCount > 0;

  return (
    <Card className='border-dashed'>
      <CardContent className='flex flex-col items-center gap-4 py-8 px-6 text-center'>
        <div className='flex items-center justify-center w-14 h-14 rounded-full bg-muted'>
          {hasOwnListings ? (
            <Ticket className='w-7 h-7 text-muted-foreground' />
          ) : (
            <TicketX className='w-7 h-7 text-muted-foreground' />
          )}
        </div>
        <div className='space-y-1'>
          <p className='font-medium text-foreground'>
            {hasOwnListings
              ? 'No hay otras entradas disponibles'
              : 'No hay entradas disponibles'}
          </p>
          <p className='text-sm text-muted-foreground'>
            {hasOwnListings ? (
              <>
                Tenés{' '}
                <Link
                  to='/cuenta/publicaciones'
                  className='text-primary underline underline-offset-2'
                >
                  {userListingsCount}{' '}
                  {userListingsCount === 1
                    ? 'publicación activa'
                    : 'publicaciones activas'}
                </Link>{' '}
                en este evento.
              </>
            ) : (
              '¿Tenés entradas que no vas a usar? Publicá las acá.'
            )}
          </p>
        </div>
        <Button
          onClick={() => {
            void navigate({
              to: '/entradas/publicar',
              search: {eventoId: eventId},
            });
          }}
          className='bg-primary-gradient h-11 px-6'
        >
          Publicar mis entradas
        </Button>
      </CardContent>
    </Card>
  );
}
