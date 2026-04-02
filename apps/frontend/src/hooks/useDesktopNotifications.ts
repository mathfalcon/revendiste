import {useCallback, useEffect, useRef, useState} from 'react';

type PermissionState = NotificationPermission | 'unsupported';

export function useDesktopNotifications(unseenCount: number) {
  const previousCount = useRef(unseenCount);
  const [permission, setPermission] = useState<PermissionState>('default');

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (permission !== 'granted') return;

    if (unseenCount > previousCount.current) {
      const diff = unseenCount - previousCount.current;
      const notification = new Notification('Revendiste', {
        body:
          diff === 1
            ? 'Tienes una nueva notificación'
            : `Tienes ${diff} nuevas notificaciones`,
        icon: '/favicon.ico',
        tag: 'revendiste-unseen',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    previousCount.current = unseenCount;
  }, [unseenCount, permission]);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  return {permission, requestPermission};
}
