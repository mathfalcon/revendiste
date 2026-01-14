import {AlertCircle} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

interface LivenessErrorCardProps {
  error: string;
  attemptsRemaining: number | null;
  maxAttemptsReached: boolean;
  onBack: () => void;
  onRetry: () => void;
}

export function LivenessErrorCard({
  error,
  attemptsRemaining,
  maxAttemptsReached,
  onBack,
  onRetry,
}: LivenessErrorCardProps) {
  const noAttemptsLeft =
    maxAttemptsReached ||
    (attemptsRemaining !== null && attemptsRemaining <= 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          {noAttemptsLeft
            ? 'Llegaste al límite de intentos'
            : 'Algo salió mal'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {noAttemptsLeft ? (
          <>
            <p className="text-sm text-muted-foreground">
              Llegaste al límite de intentos para verificar tu identidad.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">¿Qué puedo hacer?</p>
              <p className="text-sm text-muted-foreground">
                Contactanos a soporte para que podamos ayudarte a completar la
                verificación.
              </p>
            </div>
            <Button variant="outline" onClick={onBack} className="w-full">
              Volver
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{error}</p>
            {attemptsRemaining !== null && attemptsRemaining > 0 && (
              <p className="text-sm text-muted-foreground">
                Te quedan {attemptsRemaining} intento
                {attemptsRemaining !== 1 ? 's' : ''}
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack} className="flex-1">
                Volver
              </Button>
              <Button onClick={onRetry} className="flex-1">
                Intentar de nuevo
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
