import {Loader} from '@aws-amplify/ui-react';
import {Card, CardContent} from '~/components/ui/card';

export function LivenessVerifyingCard() {
  return (
    <Card>
      <CardContent className='py-12'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <Loader size='large' />
          <p className='text-sm text-muted-foreground'>
            Verificando tu identidad...
          </p>
          <p className='text-xs text-muted-foreground'>
            Esto puede tomar unos segundos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
