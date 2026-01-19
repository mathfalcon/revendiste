import {AlertCircle} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export function LivenessSecureContextError() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Se necesita una conexión segura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Para verificar tu identidad necesitamos acceder a tu cámara, y eso
          requiere una conexión HTTPS segura.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">Para continuar:</p>
          <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
            <li>
              Abrí esta página desde{' '}
              <span className="font-mono text-xs">
                https://revendiste.com
              </span>
            </li>
            <li>O si estás en desarrollo, usá localhost o un túnel HTTPS</li>
          </ol>
        </div>
        <p className="text-xs text-muted-foreground">
          URL actual:{' '}
          <span className="font-mono">{window.location.origin}</span>
        </p>
      </CardContent>
    </Card>
  );
}
