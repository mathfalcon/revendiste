import {useCallback, useEffect, useRef, useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {
  subscribePushMutation,
  unsubscribePushMutation,
} from '~/lib/api/notifications';
import {VITE_VAPID_PUBLIC_KEY} from '~/config/env';

type PushPermission = NotificationPermission | 'unsupported';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<PushPermission>('unsupported');
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const subscribeMutation = useMutation(subscribePushMutation());
  const unsubscribeMutation = useMutation(unsubscribePushMutation());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      !!VITE_VAPID_PUBLIC_KEY;

    setIsSupported(supported);
    if (!supported) return;

    setPermission(Notification.permission);

    // Register SW passively and check existing subscription
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        registrationRef.current = reg;
        return reg.pushManager.getSubscription();
      })
      .then(sub => {
        setIsSubscribed(!!sub);
      })
      .catch(() => {
        // SW registration failed — silently degrade
      });
  }, []);

  const subscribe = useCallback(async () => {
    try {
      console.log('[Push] subscribe called', {
        isSupported,
        VITE_VAPID_PUBLIC_KEY: !!VITE_VAPID_PUBLIC_KEY,
      });
      if (!isSupported || !VITE_VAPID_PUBLIC_KEY) return;

      let reg = registrationRef.current;
      if (!reg) {
        console.log('[Push] registering SW...');
        reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        registrationRef.current = reg;
      }

      console.log('[Push] requesting permission...');
      const result = await Notification.requestPermission();
      console.log('[Push] permission result:', result);
      setPermission(result);
      if (result !== 'granted') return;

      console.log('[Push] subscribing to push manager...');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VITE_VAPID_PUBLIC_KEY),
      });

      const json = sub.toJSON();
      console.log('[Push] sending subscription to backend...');
      await subscribeMutation.mutateAsync({
        endpoint: json.endpoint!,
        keys: {p256dh: json.keys!.p256dh!, auth: json.keys!.auth!},
        userAgent: navigator.userAgent,
      });

      console.log('[Push] subscribed successfully');
      setIsSubscribed(true);
    } catch (error) {
      console.error('[Push] subscribe error:', error);
    }
  }, [isSupported, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    const reg = registrationRef.current;
    if (!reg) return;

    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    await unsubscribeMutation.mutateAsync({endpoint: sub.endpoint});
    await sub.unsubscribe();
    setIsSubscribed(false);
  }, [unsubscribeMutation]);

  return {isSupported, isSubscribed, permission, subscribe, unsubscribe};
}
