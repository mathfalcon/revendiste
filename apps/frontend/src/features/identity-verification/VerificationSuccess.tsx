import {useNavigate} from '@tanstack/react-router';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {CheckCircle2, ArrowLeft} from 'lucide-react';

export function VerificationSuccess() {
  const navigate = useNavigate();

  return (
    <div className='container mx-auto max-w-2xl px-4 py-8'>
      <Card>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
            <CheckCircle2 className='h-8 w-8 text-green-600' />
          </div>
          <CardTitle className='text-2xl'>
            ¡Tu identidad está verificada!
          </CardTitle>
        </CardHeader>
        <CardContent className='text-center space-y-4'>
          <p className='text-muted-foreground'>
            Ya podés publicar entradas en Revendiste sin problemas.
          </p>
          <div className='flex gap-3 justify-center'>
            <Button onClick={() => navigate({to: '/entradas/publicar'})}>
              Publicar entrada
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
