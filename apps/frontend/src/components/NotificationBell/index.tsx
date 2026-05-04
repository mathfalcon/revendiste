import {useCallback, useEffect, useRef, useState} from 'react';
import {Bell} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {Badge} from '~/components/ui/badge';
import {Popover, PopoverContent, PopoverTrigger} from '~/components/ui/popover';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getNotificationsInfiniteQuery,
  getUnseenCountQuery,
  markAsSeenMutation,
  markAllAsSeenMutation,
  testPushMutation,
  testInAppMutation,
} from '~/lib/api/notifications';
import {NotificationDropdown} from '../NotificationDropdown';
import {
  NotificationToastContainer,
  useNotificationToasts,
} from '../NotificationToast';
import {cn} from '~/lib/utils';
import {toast} from 'sonner';
import {Send} from 'lucide-react';
import {VITE_APP_ENV} from '~/config/env';
import {
  useDesktopNotifications,
  usePushNotifications,
  usePwaInstall,
} from '~/hooks';
import type {TypedNotification} from '~/lib/api/generated';

export const NotificationBell = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const openRef = useRef(open);
  openRef.current = open;

  const push = usePushNotifications();
  const pwaInstall = usePwaInstall();
  const {toasts, remove, flyToBellAndRemove, addToast, registerHandle} =
    useNotificationToasts();

  const pollingInterval = push.isSubscribed ? 60_000 : 15_000;

  const {data: unseenCount = 0} = useQuery({
    ...getUnseenCountQuery(),
    refetchInterval: pollingInterval,
  });

  const {permission: desktopPermission, requestPermission} =
    useDesktopNotifications(push.isSubscribed ? 0 : unseenCount);

  const {
    data: notifications,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    ...getNotificationsInfiniteQuery(true, 20),
    refetchInterval: pollingInterval,
  });

  const markAsSeen = useMutation({
    ...markAsSeenMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notifications']});
    },
    onError: () => {
      toast.error('Error al marcar notificación como vista');
    },
  });

  const detectAndShowNewNotifications = useCallback(
    (allNotifications: TypedNotification[]) => {
      if (initialLoadRef.current) {
        allNotifications.forEach(n => seenIdsRef.current.add(n.id));
        initialLoadRef.current = false;
        return;
      }

      const newUnseen = allNotifications.filter(
        n => !n.seenAt && !seenIdsRef.current.has(n.id),
      );

      newUnseen.forEach(n => {
        seenIdsRef.current.add(n.id);
        if (!openRef.current) {
          addToast(n);
        }
      });
    },
    [addToast],
  );

  useEffect(() => {
    if (!notifications?.pages) return;
    const allItems = notifications.pages.flatMap(page => page.data);
    detectAndShowNewNotifications(allItems);
  }, [notifications, detectAndShowNewNotifications]);

  const handleBellHover = () => {
    refetch();
  };

  const handleDismissToast = useCallback(
    (id: string) => {
      remove(id);
    },
    [remove],
  );

  const handleTimerExpired = useCallback(
    (id: string) => {
      flyToBellAndRemove(id);
      markAsSeen.mutate(id);
    },
    // markAsSeen is stable via useMutation, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flyToBellAndRemove],
  );

  const markAllAsSeen = useMutation({
    ...markAllAsSeenMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notifications']});
      toast.success('Todas las notificaciones marcadas como vistas');
    },
    onError: () => {
      toast.error('Error al marcar todas las notificaciones como vistas');
    },
  });

  const handleNotificationClick = (notificationId: string) => {
    markAsSeen.mutate(notificationId);
  };

  const handleMarkAllAsSeen = () => {
    markAllAsSeen.mutate();
  };

  const testPush = useMutation({
    ...testPushMutation(),
    onSuccess: data => {
      toast.success(`Push enviado a ${data.sent} dispositivo(s)`);
    },
    onError: () => {
      toast.error('Error al enviar push de prueba');
    },
  });

  const testInApp = useMutation({
    ...testInAppMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notifications']});
    },
    onError: () => {
      toast.error('Error al crear notificación de prueba');
    },
  });

  const showPushPrompt =
    push.isSupported && !push.isSubscribed && push.permission !== 'denied';
  const showInstallPrompt =
    !push.isSupported &&
    pwaInstall.isIos &&
    pwaInstall.isMobile &&
    !pwaInstall.isStandalone;
  const showDesktopPrompt =
    !push.isSupported && !showInstallPrompt && desktopPermission === 'default';

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={bellRef}
            variant='ghost'
            size='icon'
            className='relative'
            aria-label='Notificaciones'
            onMouseEnter={handleBellHover}
          >
            <Bell className='h-5 w-5' />
            {unseenCount > 0 && (
              <Badge
                variant='destructive'
                className={cn(
                  'absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs',
                )}
              >
                {unseenCount > 9 ? '9+' : unseenCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-80 p-0' align='end' sideOffset={8}>
          <NotificationDropdown
            notifications={
              notifications?.pages.flatMap(page => page.data) ?? []
            }
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage ?? false}
            fetchNextPage={fetchNextPage}
            onNotificationClick={handleNotificationClick}
            onMarkAllAsSeen={handleMarkAllAsSeen}
            hasUnseen={unseenCount > 0}
          />
          {showPushPrompt && (
            <div className='border-t px-4 py-2 text-center'>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 text-xs text-muted-foreground'
                onClick={push.subscribe}
              >
                <Bell className='mr-1.5 h-3 w-3' />
                Activar notificaciones
              </Button>
            </div>
          )}
          {showInstallPrompt && (
            <div className='border-t px-4 py-2 text-center'>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 text-xs text-muted-foreground'
                onClick={() => {
                  pwaInstall.resetDismissal();
                  pwaInstall.promptInstall();
                }}
              >
                <Bell className='mr-1.5 h-3 w-3' />
                Instalá la app para recibir notificaciones
              </Button>
            </div>
          )}
          {showDesktopPrompt && (
            <div className='border-t px-4 py-2 text-center'>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 text-xs text-muted-foreground'
                onClick={requestPermission}
              >
                <Bell className='mr-1.5 h-3 w-3' />
                Activar notificaciones de escritorio
              </Button>
            </div>
          )}
          {VITE_APP_ENV !== 'production' && (
            <div className='border-t px-4 py-2 flex flex-col items-center gap-1'>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 text-xs text-muted-foreground'
                onClick={() => {
                  setOpen(false);
                  testInApp.mutate();
                }}
                disabled={testInApp.isPending}
              >
                <Bell className='mr-1.5 h-3 w-3' />
                {testInApp.isPending ? 'Creando...' : 'Test in-app toast'}
              </Button>
              {push.isSubscribed && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 text-xs text-muted-foreground'
                  onClick={() => testPush.mutate()}
                  disabled={testPush.isPending}
                >
                  <Send className='mr-1.5 h-3 w-3' />
                  {testPush.isPending
                    ? 'Enviando...'
                    : 'Test push notification'}
                </Button>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      <NotificationToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onTimerExpired={handleTimerExpired}
        bellRef={bellRef}
        onMount={registerHandle}
      />
    </>
  );
};
