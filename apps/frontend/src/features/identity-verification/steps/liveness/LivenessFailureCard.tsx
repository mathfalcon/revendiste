import {
  AlertCircle,
  RefreshCw,
  Sun,
  Smartphone,
  User,
  Glasses,
  SunDim,
  MoveHorizontal,
} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

interface LivenessFailureCardProps {
  failureMessage?: string;
  onBack: () => void;
  onRetry?: () => void;
  /** If true, shows a more encouraging message for borderline cases */
  isBorderline?: boolean;
}

export function LivenessFailureCard({
  failureMessage,
  onBack,
  onRetry,
  isBorderline = false,
}: LivenessFailureCardProps) {
  // Determine if this is a borderline retry based on the message content
  const showRetryEncouragement =
    isBorderline ||
    failureMessage?.includes('intento');

  return (
    <Card>
      <CardHeader>
        <CardTitle
          className={`flex items-center gap-2 ${showRetryEncouragement ? 'text-amber-600' : 'text-destructive'}`}
        >
          {showRetryEncouragement ? (
            <>
              <RefreshCw className="h-5 w-5" />
              Casi lo lográs
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5" />
              No pudimos verificarte
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {failureMessage || 'No pudimos completar la verificación de tu identidad.'}
        </p>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3">
            {showRetryEncouragement
              ? 'Probá estos consejos para que salga mejor:'
              : 'Consejos para el próximo intento:'}
          </p>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
            <li className="flex items-start gap-2">
              <Sun className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Buscá un lugar con <strong>buena luz</strong>, ni muy oscuro ni
                con luz directa en la cara
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Smartphone className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <strong>Subí el brillo de tu pantalla al máximo</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Mantené tu <strong>cara centrada</strong> y mirá directo a la
                cámara
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MoveHorizontal className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <strong>Quedate quieto/a</strong> durante todo el proceso
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Glasses className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <strong>Sacate los anteojos, gorras o accesorios</strong> que
                tapen tu cara
              </span>
            </li>
            <li className="flex items-start gap-2">
              <SunDim className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Evitá tener una ventana o luz fuerte atrás tuyo
              </span>
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Volver
          </Button>
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              Intentar de nuevo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
