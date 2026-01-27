import {createFileRoute, Link} from '@tanstack/react-router';
import {useQuery} from '@tanstack/react-query';
import {getCurrentUserQuery} from '~/lib';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import {seo} from '~/utils/seo';

export const Route = createFileRoute('/cuenta/estado-verificacion')({
  component: VerificationStatusPage,
  head: () => ({
    meta: [
      ...seo({
        title: 'Estado de Verificación | Revendiste',
        description: 'Consultá el estado de tu verificación de identidad.',
        noIndex: true,
      }),
    ],
  }),
  // Auth check handled by parent /cuenta route
});

function VerificationStatusPage() {
  const {data: user, isLoading} = useQuery(getCurrentUserQuery());

  if (isLoading) {
    return (
      <div className='container mx-auto max-w-lg px-4 py-8'>
        <Card>
          <CardContent className='flex items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </CardContent>
        </Card>
      </div>
    );
  }

  const verificationStatus = user?.verificationStatus;
  const documentVerified = user?.documentVerified;
  const canRetry = user?.canRetryLiveness;

  // Determine the status to display
  const getStatusConfig = () => {
    // User is verified
    if (documentVerified) {
      return {
        icon: <CheckCircle2 className='h-10 w-10 text-green-600' />,
        iconBg: 'bg-green-100',
        title: '¡Identidad verificada!',
        description:
          'Tu identidad fue verificada exitosamente. Ya podés publicar entradas en Revendiste.',
        showAction: true,
        actionLabel: 'Publicar entradas',
        actionTo: '/entradas/publicar' as const,
        variant: 'default' as const,
      };
    }

    // Verification in manual review
    if (verificationStatus === 'requires_manual_review') {
      return {
        icon: <Clock className='h-10 w-10 text-amber-600' />,
        iconBg: 'bg-amber-100',
        title: 'En revisión',
        description:
          'Tu verificación está siendo revisada por nuestro equipo. Te avisaremos cuando esté lista.',
        showAction: false,
        actionLabel: '',
        actionTo: '/cuenta/verificar' as const,
        variant: 'secondary' as const,
      };
    }

    // Verification rejected by admin
    if (verificationStatus === 'rejected') {
      return {
        icon: <XCircle className='h-10 w-10 text-red-600' />,
        iconBg: 'bg-red-100',
        title: 'Verificación rechazada',
        description: canRetry
          ? 'Tu verificación fue rechazada. Podés intentarlo nuevamente.'
          : 'Tu verificación fue rechazada. Por favor, contactá a soporte si tenés dudas.',
        showAction: canRetry,
        actionLabel: 'Reintentar verificación',
        actionTo: '/cuenta/verificar' as const,
        variant: 'default' as const,
      };
    }

    // Verification failed (system failure)
    if (verificationStatus === 'failed') {
      return {
        icon: <AlertTriangle className='h-10 w-10 text-orange-600' />,
        iconBg: 'bg-orange-100',
        title: 'Verificación fallida',
        description: canRetry
          ? 'No pudimos completar tu verificación. Podés intentarlo nuevamente.'
          : 'No pudimos completar tu verificación y se agotaron los intentos. Por favor, contactá a soporte.',
        showAction: canRetry,
        actionLabel: 'Reintentar verificación',
        actionTo: '/cuenta/verificar' as const,
        variant: 'default' as const,
      };
    }

    // Verification pending (in progress or not started)
    if (verificationStatus === 'pending') {
      return {
        icon: <ShieldCheck className='h-10 w-10 text-primary' />,
        iconBg: 'bg-primary/10',
        title: 'Verificación en progreso',
        description:
          'Empezaste el proceso de verificación. Continuá para completarlo.',
        showAction: true,
        actionLabel: 'Continuar verificación',
        actionTo: '/cuenta/verificar' as const,
        variant: 'default' as const,
      };
    }

    // Not started (null status)
    return {
      icon: <ShieldCheck className='h-10 w-10 text-primary' />,
      iconBg: 'bg-primary/10',
      title: 'Verificación pendiente',
      description:
        'Para publicar entradas en Revendiste, necesitás verificar tu identidad. Es un proceso rápido y seguro.',
      showAction: true,
      actionLabel: 'Comenzar verificación',
      actionTo: '/cuenta/verificar' as const,
      variant: 'default' as const,
    };
  };

  const config = getStatusConfig();

  return (
    <div className='container mx-auto max-w-lg px-4 py-8'>
      <Card>
        <CardHeader className='text-center pb-2'>
          <div
            className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${config.iconBg}`}
          >
            {config.icon}
          </div>
          <CardTitle className='text-xl'>{config.title}</CardTitle>
          <CardDescription className='text-base'>
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-4'>
          {config.showAction && (
            <Button asChild className='w-full' variant={config.variant}>
              <Link to={config.actionTo}>{config.actionLabel}</Link>
            </Button>
          )}
          {!config.showAction &&
            verificationStatus === 'requires_manual_review' && (
              <p className='text-center text-sm text-muted-foreground'>
                Este proceso puede demorar hasta 24 horas hábiles.
              </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
