import {CalendarX} from 'lucide-react';
import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';

export function PastEventBanner() {
  return (
    <Alert>
      <CalendarX className='h-4 w-4' />
      <AlertTitle>Este evento ya finalizó</AlertTitle>
      <AlertDescription>
        El evento ya pasó, pero podés explorar otros eventos disponibles a
        continuación.
      </AlertDescription>
    </Alert>
  );
}
