import type {FC} from 'react';
import {Button} from '~/components/ui/button';
import {ScrollArea} from '~/components/ui/scroll-area';
import {TextEllipsis} from '~/components/ui/text-ellipsis';
import {cn} from '~/lib/utils';
import type {TypedNotification} from '~/lib/api/generated';
import type {NotificationType} from '@revendiste/shared';
import {formatDistanceToNow} from 'date-fns';
import {es} from 'date-fns/locale';
import {
  CheckCheck,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Ticket,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import {useInfiniteScroll} from '~/hooks';

interface NotificationDropdownProps {
  notifications: TypedNotification[];
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  onNotificationClick: (notificationId: string) => void;
  onMarkAllAsSeen: () => void;
  hasUnseen: boolean;
}

const getNotificationIcon = (type: NotificationType): LucideIcon => {
  switch (type) {
    case 'document_reminder':
      return FileText;
    case 'order_confirmed':
      return CheckCircle;
    case 'order_expired':
      return Clock;
    case 'payment_failed':
      return XCircle;
    case 'payment_succeeded':
      return CreditCard;
    case 'ticket_sold_seller':
      return Ticket;
    case 'seller_earnings_available':
      return Wallet;
    default:
      return FileText;
  }
};

const getNotificationIconColor = (type: NotificationType): string => {
  switch (type) {
    case 'order_confirmed':
    case 'payment_succeeded':
      return 'text-green-600';
    case 'order_expired':
    case 'payment_failed':
      return 'text-red-600';
    case 'document_reminder':
      return 'text-blue-600';
    case 'ticket_sold_seller':
      return 'text-purple-600';
    case 'seller_earnings_available':
      return 'text-emerald-600';
    default:
      return 'text-muted-foreground';
  }
};

export const NotificationDropdown: FC<NotificationDropdownProps> = ({
  notifications,
  isLoading,
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
  onNotificationClick,
  onMarkAllAsSeen,
  hasUnseen,
}) => {
  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: fetchNextPage ?? (() => {}),
    enabled: !!fetchNextPage,
  });
  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className='p-6 text-center text-sm text-muted-foreground'>
        No tienes notificaciones
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      <div className='flex items-center justify-between border-b px-4 py-3 gap-2'>
        <h3 className='font-semibold text-sm'>Notificaciones</h3>
        {hasUnseen && (
          <Button
            variant='ghost'
            size='sm'
            className='h-7 text-xs whitespace-nowrap shrink-0'
            onClick={onMarkAllAsSeen}
          >
            <CheckCheck className='mr-1.5 h-3 w-3' />
            Marcar todas
          </Button>
        )}
      </div>
      <ScrollArea className='max-h-[400px] overflow-y-auto'>
        <div className='divide-y'>
          {notifications.map(notification => {
            const isUnseen = !notification.seenAt;
            const Icon = getNotificationIcon(notification.type);
            const iconColor = getNotificationIconColor(notification.type);

            return (
              <div
                key={notification.id}
                className={cn(
                  'px-4 py-3 hover:bg-accent transition-colors cursor-pointer',
                  isUnseen && 'bg-accent/50',
                )}
                onClick={() => {
                  if (isUnseen) {
                    onNotificationClick(notification.id);
                  }
                }}
              >
                <div className='flex items-start gap-3'>
                  <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconColor)} />
                  <div className='flex-1 min-w-0 pr-2'>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isUnseen && 'font-semibold',
                      )}
                    >
                      {notification.title}
                    </p>
                    {notification.description && (
                      <TextEllipsis
                        className='text-xs text-muted-foreground mt-1'
                        maxLines={2}
                      >
                        {notification.description}
                      </TextEllipsis>
                    )}
                    <p className='text-xs text-muted-foreground mt-1'>
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                    {notification.actions?.[0] && (
                      <Button
                        variant='outline'
                        size='sm'
                        className='mt-2 h-7 text-xs'
                        onClick={e => {
                          e.stopPropagation();
                          if (isUnseen) {
                            onNotificationClick(notification.id);
                          }
                          if (notification.actions![0]!.url) {
                            window.location.href = notification.actions![0]!.url;
                          }
                        }}
                      >
                        {notification.actions[0].label}
                      </Button>
                    )}
                  </div>
                  {isUnseen && (
                    <div className='h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5' />
                  )}
                </div>
              </div>
            );
          })}
          {/* Show loading indicator while fetching next page */}
          {isFetchingNextPage && (
            <div className='flex items-center justify-center px-4 py-3'>
              <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
            </div>
          )}
          {/* Sentinel element for infinite scroll */}
          {hasNextPage && (
            <div ref={sentinelRef} className='h-1' aria-hidden='true' />
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
