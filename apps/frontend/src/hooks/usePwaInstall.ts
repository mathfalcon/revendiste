import {useCallback, useEffect, useRef, useState} from 'react';

const DISMISS_KEY = 'revendiste:pwa-install-dismissed';
const DISMISS_FOREVER_KEY = 'revendiste:pwa-install-dismissed-forever';
const TEMP_DISMISS_DAYS = 30;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{outcome: 'accepted' | 'dismissed'}>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  );
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;

  if (localStorage.getItem(DISMISS_FOREVER_KEY) === 'true') return true;

  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return false;

  const dismissDate = new Date(dismissedAt);
  const daysSince =
    (Date.now() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < TEMP_DISMISS_DAYS;
}

const PWA_RESET_EVENT = 'revendiste:pwa-reset-dismissal';

export function usePwaInstall() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [showIosSheet, setShowIosSheet] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone = isStandaloneMode();
    const ios = isIosDevice();
    const mobile = isMobileDevice();

    setIsStandalone(standalone);
    setIsIos(ios);
    setIsMobile(mobile);

    // Already installed or desktop — no prompt
    if (standalone || !mobile) {
      setCanPrompt(false);
      return;
    }

    if (isDismissed()) {
      setCanPrompt(false);
    } else if (ios) {
      // iOS can always show manual instructions
      setCanPrompt(true);
    }

    // Listen for reset events from other hook instances
    const onReset = () => setCanPrompt(true);
    window.addEventListener(PWA_RESET_EVENT, onReset);

    // Android/Chrome — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      if (!isDismissed()) {
        setCanPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener(PWA_RESET_EVENT, onReset);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (isIos) {
      setShowIosSheet(true);
      return;
    }

    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    const {outcome} = await prompt.prompt();
    if (outcome === 'accepted') {
      setCanPrompt(false);
      deferredPromptRef.current = null;
    }
  }, [isIos]);

  const dismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    }
    setCanPrompt(false);
  }, []);

  const dismissForever = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_FOREVER_KEY, 'true');
    }
    setCanPrompt(false);
  }, []);

  const closeIosSheet = useCallback(() => {
    setShowIosSheet(false);
  }, []);

  const resetDismissal = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DISMISS_KEY);
      localStorage.removeItem(DISMISS_FOREVER_KEY);
      window.dispatchEvent(new Event(PWA_RESET_EVENT));
    }
    setCanPrompt(true);
  }, []);

  return {
    canPrompt,
    isIos,
    isStandalone,
    isMobile,
    showIosSheet,
    promptInstall,
    dismiss,
    dismissForever,
    closeIosSheet,
    resetDismissal,
  };
}
