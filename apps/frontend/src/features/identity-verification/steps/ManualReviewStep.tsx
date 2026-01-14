import {useNavigate} from '@tanstack/react-router';
import {Button} from '~/components/ui/button';
import {Badge} from '~/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Clock, ArrowLeft} from 'lucide-react';

export function ManualReviewStep() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificación en revisión</CardTitle>
        <CardDescription>
          Nuestro equipo está revisando tu información
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='text-center py-6'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
            <Clock className='h-6 w-6 text-yellow-600' />
          </div>
          <Badge variant='secondary' className='mb-4'>
            En proceso
          </Badge>
          <p className='text-sm text-muted-foreground mb-2'>
            Este proceso puede tomar entre 24 y 48 horas hábiles.
          </p>
          <p className='text-sm text-muted-foreground mb-6'>
            Te vamos a avisar por email cuando tu verificación esté lista.
          </p>
          <Button
            variant='outline'
            onClick={() => navigate({to: '/cuenta/publicaciones'})}
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Volver a mi cuenta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
