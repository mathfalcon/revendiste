import {Card, CardContent} from '~/components/ui/card';

export function EmptyState() {
  return (
    <Card className='w-full'>
      <CardContent className='flex h-96 items-center justify-center'>
        <div className='text-center'>
          <p className='text-lg font-semibold'>No hay tickets para subir</p>
          <p className='text-muted-foreground'>
            Cuando tus publicaciones sean vendidas, aparecerán aquí para que
            puedas subir sus documentos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
