import {Badge} from '~/components/ui/badge';

export function statusBadge(status: string) {
  switch (status) {
    case 'pending':
      return (
        <Badge className='border-yellow-500 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300'>
          Pendiente
        </Badge>
      );
    case 'processing':
      return <Badge variant='secondary'>Procesando</Badge>;
    case 'completed':
      return (
        <Badge className='border-green-600 bg-green-500/10 text-green-800 dark:text-green-300'>
          Completado
        </Badge>
      );
    case 'failed':
      return <Badge variant='destructive'>Fallido</Badge>;
    case 'cancelled':
      return <Badge variant='outline'>Cancelado</Badge>;
    default:
      return <Badge variant='outline'>{status}</Badge>;
  }
}

export function providerLabel(provider: string) {
  return provider.replace(/_/g, ' ');
}

export function formatAge(requestedAt: string) {
  const ageMs = Date.now() - new Date(requestedAt).getTime();
  const ageHours = Math.floor(ageMs / 3_600_000);
  if (ageHours < 1) return 'Menos de 1 h';
  if (ageHours < 48) return `${ageHours} h`;
  return `${Math.floor(ageHours / 24)} d`;
}
