import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useSession} from '@clerk/tanstack-react-start';
import {getSessionsQuery, revokeSessionMutation} from '~/lib/api/profile';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {Badge} from '~/components/ui/badge';
import {Monitor, Smartphone, Globe, Loader2, X} from 'lucide-react';

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionsList() {
  const {session: currentSession} = useSession();
  const queryClient = useQueryClient();
  const {data: sessions, isLoading} = useQuery(getSessionsQuery());

  const revoke = useMutation({
    ...revokeSessionMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['profile', 'sessions']});
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sesiones activas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-3'>
            <div className='h-16 bg-muted rounded' />
            <div className='h-16 bg-muted rounded' />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesiones activas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {sessions?.map(session => {
            const isCurrent = session.id === currentSession?.id;
            const activity = session.latestActivity;

            return (
              <div
                key={session.id}
                className='flex items-center justify-between rounded-lg border p-3'
              >
                <div className='flex items-center gap-3'>
                  {activity?.isMobile ? (
                    <Smartphone className='h-5 w-5 text-muted-foreground' />
                  ) : (
                    <Monitor className='h-5 w-5 text-muted-foreground' />
                  )}
                  <div>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm font-medium'>
                        {activity?.browserName || 'Navegador desconocido'}
                        {activity?.browserVersion
                          ? ` ${activity.browserVersion}`
                          : ''}
                      </p>
                      {isCurrent && (
                        <Badge variant='secondary' className='text-xs'>
                          Actual
                        </Badge>
                      )}
                    </div>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      {activity?.city && activity?.country && (
                        <>
                          <Globe className='h-3 w-3' />
                          <span>
                            {activity.city}, {activity.country}
                          </span>
                          <span className='mx-1'>·</span>
                        </>
                      )}
                      <span>
                        Última actividad: {formatDate(session.lastActiveAt)}
                      </span>
                    </div>
                  </div>
                </div>
                {!isCurrent && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => revoke.mutate(session.id)}
                    disabled={revoke.isPending}
                    title='Cerrar sesión'
                  >
                    {revoke.isPending ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <X className='h-4 w-4' />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
          {(!sessions || sessions.length === 0) && (
            <p className='text-sm text-muted-foreground'>
              No hay sesiones activas.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
