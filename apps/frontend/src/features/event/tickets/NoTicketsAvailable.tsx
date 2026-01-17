import {useNavigate} from '@tanstack/react-router';
import {Button} from '~/components/ui/button';
import {Card, CardContent} from '~/components/ui/card';
import {TicketX} from 'lucide-react';

interface NoTicketsAvailableProps {
  eventId: string;
}

export function NoTicketsAvailable({eventId}: NoTicketsAvailableProps) {
  const navigate = useNavigate();

  return (
    <Card className='border-dashed'>
      <CardContent className='flex flex-col items-center gap-4 py-8 px-6 text-center'>
        <div className='flex items-center justify-center w-14 h-14 rounded-full bg-muted'>
          <TicketX className='w-7 h-7 text-muted-foreground' />
        </div>
        <div className='space-y-1'>
          <p className='font-medium text-foreground'>
            No hay entradas disponibles
          </p>
          <p className='text-sm text-muted-foreground'>
            ¿Tenés entradas que no vas a usar? Publicalas acá.
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
