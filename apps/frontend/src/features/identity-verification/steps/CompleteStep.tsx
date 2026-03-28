import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export function CompleteStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>¡Verificación Completada!</CardTitle>
        <CardDescription>
          Tu identidad se verificó
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='text-center py-8'>
          <div className='w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-white text-2xl'>✓</span>
          </div>
          <p>Ya puedes vender entradas en Revendiste</p>
        </div>
      </CardContent>
    </Card>
  );
}
