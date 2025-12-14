import {useState} from 'react';
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
} from '~/lib/api/notifications';
import {NotificationDropdown} from '../NotificationDropdown';
import {cn} from '~/lib/utils';
import {toast} from 'sonner';

const POLLING_INTERVAL = 15_000; // 15 seconds - industry standard for notification polling

export const NotificationBell = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const {data: unseenCount = 0} = useQuery({
    ...getUnseenCountQuery(),
    refetchInterval: POLLING_INTERVAL,
  });

  const {
    data: notifications,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    ...getNotificationsInfiniteQuery(true, 20),
  });

  const handleBellHover = () => {
    refetch();
  };

  const markAsSeen = useMutation({
    ...markAsSeenMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notifications']});
    },
    onError: error => {
      toast.error('Error al marcar notificación como vista');
    },
  });

  const markAllAsSeen = useMutation({
    ...markAllAsSeenMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notifications']});
      toast.success('Todas las notificaciones marcadas como vistas');
    },
    onError: error => {
      toast.error('Error al marcar todas las notificaciones como vistas');
    },
  });

  const handleNotificationClick = (notificationId: string) => {
    markAsSeen.mutate(notificationId);
  };

  const handleMarkAllAsSeen = () => {
    markAllAsSeen.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
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
          notifications={notifications?.pages.flatMap(page => page.data) ?? []}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage ?? false}
          fetchNextPage={fetchNextPage}
          onNotificationClick={handleNotificationClick}
          onMarkAllAsSeen={handleMarkAllAsSeen}
          hasUnseen={unseenCount > 0}
        />
      </PopoverContent>
    </Popover>
  );
};
