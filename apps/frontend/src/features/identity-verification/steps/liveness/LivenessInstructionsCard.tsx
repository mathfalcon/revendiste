import {Loader} from '@aws-amplify/ui-react';
import {
  Camera,
  Shield,
  Sun,
  SunDim,
  Smartphone,
  User,
  Glasses,
} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

interface LivenessInstructionsCardProps {
  onBack: () => void;
  onStartVerification: () => void;
  isLoading: boolean;
}

export function LivenessInstructionsCard({
  onBack,
  onStartVerification,
  isLoading,
}: LivenessInstructionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificación de identidad</CardTitle>
        <CardDescription>
          Vamos a confirmar que sos la persona que aparece en el documento
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='bg-muted/50 rounded-lg p-4 space-y-3'>
          <p className='text-sm font-medium'>¿Qué va a pasar?</p>
          <ul className='text-sm text-muted-foreground space-y-2'>
            <li className='flex items-start gap-2'>
              <Shield className='h-4 w-4 mt-0.5 text-primary shrink-0' />
              <span>Se va a activar tu cámara para capturar tu rostro</span>
            </li>
            <li className='flex items-start gap-2'>
              <Shield className='h-4 w-4 mt-0.5 text-primary shrink-0' />
              <span>Vamos a comparar tu cara con la foto de tu documento</span>
            </li>
            <li className='flex items-start gap-2'>
              <Shield className='h-4 w-4 mt-0.5 text-primary shrink-0' />
              <span>Tus datos están protegidos y seguros</span>
            </li>
          </ul>
        </div>

        <div className='bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4'>
          <p className='text-sm font-medium text-amber-800 dark:text-amber-200 mb-3'>
            Para que todo salga bien:
          </p>
          <ul className='text-sm text-amber-700 dark:text-amber-300 space-y-2'>
            <li className='flex items-start gap-2'>
              <Sun className='h-4 w-4 mt-0.5 shrink-0' />
              <span>
                Buscá un lugar con <strong>buena luz</strong>, ni muy oscuro ni
                con luz directa en la cara
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <Smartphone className='h-4 w-4 mt-0.5 shrink-0' />
              <span>
                <strong>Subí el brillo de tu pantalla al máximo</strong> para
                mejores resultados
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <User className='h-4 w-4 mt-0.5 shrink-0' />
              <span>
                Mantené tu <strong>cara centrada</strong> y mirá directo a la
                cámara
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <Glasses className='h-4 w-4 mt-0.5 shrink-0' />
              <span>
                Si podés,{' '}
                <strong>sacate los anteojos, gorras o accesorios</strong> que
                tapen tu cara
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <SunDim className='h-4 w-4 mt-0.5 shrink-0' />
              <span>
                Evitá tener una ventana o luz fuerte atrás tuyo, porque genera
                sombras
              </span>
            </li>
          </ul>
        </div>

        <div className='flex gap-3'>
          <Button variant='outline' onClick={onBack} className='flex-1'>
            Volver
          </Button>
          <Button
            onClick={onStartVerification}
            className='flex-1'
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader size='small' className='mr-2' />
                Preparando...
              </>
            ) : (
              'Comenzar'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
