import {useCallback, useEffect, useRef, useState, type RefObject} from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'motion/react';
import {X} from 'lucide-react';
import {cn} from '~/lib/utils';
import type {TypedNotification} from '~/lib/api/generated';
import type {NotificationType} from '@revendiste/shared';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Ticket,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import {formatDistanceToNow} from 'date-fns';
import {es} from 'date-fns/locale';

const AUTO_DISMISS_MS = 5000;
const DRAG_DISMISS_THRESHOLD = 80;
const MAX_VISIBLE_TOASTS = 5;

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

interface ToastItem {
  id: string;
  notification: TypedNotification;
}

export interface ToastItemHandle {
  flyToBell: () => Promise<void>;
}

function NotificationToastItem({
  item,
  onDismiss,
  onTimerExpired,
  bellRef,
  onMount,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
  onTimerExpired: (id: string) => void;
  bellRef: RefObject<HTMLElement | null>;
  onMount: (id: string, handle: ToastItemHandle | null) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const remainingRef = useRef(AUTO_DISMISS_MS);
  const lastTickRef = useRef(Date.now());
  const elementRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const dragOpacity = useTransform(
    x,
    [-DRAG_DISMISS_THRESHOLD * 1.5, 0, DRAG_DISMISS_THRESHOLD * 1.5],
    [0.3, 1, 0.3],
  );

  useEffect(() => {
    const handle: ToastItemHandle = {
      async flyToBell() {
        const el = elementRef.current;
        const bell = bellRef.current;
        if (!el || !bell) return;

        const toastRect = el.getBoundingClientRect();
        const bellRect = bell.getBoundingClientRect();

        await animate(
          el,
          {
            x:
              bellRect.left +
              bellRect.width / 2 -
              (toastRect.left + toastRect.width / 2),
            y:
              bellRect.top +
              bellRect.height / 2 -
              (toastRect.top + toastRect.height / 2),
            scale: 0,
            opacity: 0,
          },
          {duration: 0.45, ease: [0.4, 0, 0.2, 1]},
        );
      },
    };
    onMount(item.id, handle);
    return () => onMount(item.id, null);
  }, [item.id, bellRef, onMount]);

  const startTimer = useCallback(() => {
    lastTickRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onTimerExpired(item.id);
    }, remainingRef.current);
  }, [item.id, onTimerExpired]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const elapsed = Date.now() - lastTickRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  useEffect(() => {
    if (isHovered) {
      pauseTimer();
    } else if (remainingRef.current > 0) {
      startTimer();
    }
  }, [isHovered, pauseTimer, startTimer]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > DRAG_DISMISS_THRESHOLD) {
      onDismiss(item.id);
    }
  };

  const handleActionClick = (url?: string) => {
    onDismiss(item.id);
    if (url) {
      window.location.href = url;
    }
  };

  const Icon = getNotificationIcon(item.notification.type);
  const iconColor = getNotificationIconColor(item.notification.type);

  return (
    <motion.div
      ref={elementRef}
      layout
      initial={{x: 380, opacity: 0, scale: 0.85}}
      animate={{x: 0, opacity: 1, scale: 1}}
      exit={{x: 380, opacity: 0, transition: {duration: 0.2, ease: 'easeIn'}}}
      transition={{type: 'spring', stiffness: 380, damping: 28}}
      drag='x'
      dragConstraints={{left: 0, right: 0}}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      style={{x, opacity: dragOpacity}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'pointer-events-auto relative w-[340px] rounded-lg border bg-background/95 backdrop-blur-sm p-4 shadow-lg',
        'cursor-grab active:cursor-grabbing select-none touch-pan-y',
      )}
    >
      <button
        onClick={e => {
          e.stopPropagation();
          onDismiss(item.id);
        }}
        className='absolute top-2 right-2 z-10 rounded-full p-1 text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors'
        aria-label='Cerrar notificación'
      >
        <X className='h-3.5 w-3.5' />
      </button>

      <div className='flex items-start gap-3 pr-5'>
        <div className={cn('mt-0.5 shrink-0', iconColor)}>
          <Icon className='h-5 w-5' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-semibold leading-tight'>
            {item.notification.title}
          </p>
          {item.notification.description && (
            <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>
              {item.notification.description}
            </p>
          )}
          <p className='text-[11px] text-muted-foreground/60 mt-1.5'>
            {formatDistanceToNow(new Date(item.notification.createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </p>
          {item.notification.actions?.[0] && (
            <button
              className='mt-2 text-xs font-medium text-primary dark:text-primary-400 hover:underline'
              onClick={e => {
                e.stopPropagation();
                handleActionClick(item.notification.actions![0]!.url);
              }}
            >
              {item.notification.actions[0].label}
            </button>
          )}
        </div>
      </div>

      <div className='absolute bottom-0 left-0 right-0 h-[2px] rounded-b-lg overflow-hidden'>
        <div
          className='h-full bg-primary/30 dark:bg-primary-400/50 origin-left'
          style={{
            animation: `shrink ${AUTO_DISMISS_MS}ms linear forwards`,
            animationPlayState: isHovered ? 'paused' : 'running',
          }}
        />
      </div>
    </motion.div>
  );
}

export function useNotificationToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const handleRefsMap = useRef<Map<string, ToastItemHandle>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    handleRefsMap.current.delete(id);
  }, []);

  const flyToBellAndRemove = useCallback(
    async (id: string) => {
      const handle = handleRefsMap.current.get(id);
      if (handle) {
        await handle.flyToBell();
      }
      remove(id);
    },
    [remove],
  );

  const addToast = useCallback((notification: TypedNotification) => {
    setToasts(prev => {
      if (prev.some(t => t.id === notification.id)) return prev;
      return [...prev, {id: notification.id, notification}].slice(
        -MAX_VISIBLE_TOASTS,
      );
    });
  }, []);

  const registerHandle = useCallback(
    (id: string, handle: ToastItemHandle | null) => {
      if (handle) {
        handleRefsMap.current.set(id, handle);
      } else {
        handleRefsMap.current.delete(id);
      }
    },
    [],
  );

  return {toasts, remove, flyToBellAndRemove, addToast, registerHandle};
}

export function NotificationToastContainer({
  toasts,
  onDismiss,
  onTimerExpired,
  bellRef,
  onMount,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onTimerExpired: (id: string) => void;
  bellRef: RefObject<HTMLElement | null>;
  onMount: (id: string, handle: ToastItemHandle | null) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className='fixed top-20 right-4 z-100 flex flex-col gap-2 pointer-events-none'>
      <AnimatePresence>
        {toasts.map(item => (
          <NotificationToastItem
            key={item.id}
            item={item}
            onDismiss={onDismiss}
            onTimerExpired={onTimerExpired}
            bellRef={bellRef}
            onMount={onMount}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
