import {useCallback, useRef, useState} from 'react';

interface Coords {
  lat: number;
  lng: number;
}

type GeolocationStatus = 'idle' | 'loading' | 'granted' | 'denied';

interface UseGeolocationReturn {
  status: GeolocationStatus;
  coords: Coords | null;
  requestLocation: () => void;
}

const SESSION_KEY = 'revendiste_geo';

function getCachedCoords(): Coords | null {
  try {
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // SSR or storage unavailable
  }
  return null;
}

function cacheCoords(coords: Coords) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(coords));
  } catch {
    // Silently ignore
  }
}

/**
 * Hook for getting user's geolocation with IP-based fallback.
 *
 * Flow:
 * 1. Check sessionStorage cache
 * 2. Try browser navigator.geolocation
 * 3. If denied/unavailable → fall back to IP geolocation (ipapi.co)
 * 4. Cache result in sessionStorage
 */
export function useGeolocation(): UseGeolocationReturn {
  const [status, setStatus] = useState<GeolocationStatus>(() =>
    getCachedCoords() ? 'granted' : 'idle',
  );
  const [coords, setCoords] = useState<Coords | null>(getCachedCoords);
  const requestingRef = useRef(false);

  const resolveWithCoords = useCallback((c: Coords) => {
    cacheCoords(c);
    setCoords(c);
    setStatus('granted');
    requestingRef.current = false;
  }, []);

  const fallbackToIp = useCallback(async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('IP geolocation failed');
      const data = await res.json();
      if (data.latitude && data.longitude) {
        resolveWithCoords({lat: data.latitude, lng: data.longitude});
        return;
      }
    } catch {
      // IP geolocation also failed
    }
    setStatus('denied');
    requestingRef.current = false;
  }, [resolveWithCoords]);

  const requestLocation = useCallback(() => {
    // Return cached if available
    const cached = getCachedCoords();
    if (cached) {
      setCoords(cached);
      setStatus('granted');
      return;
    }

    if (requestingRef.current) return;
    requestingRef.current = true;
    setStatus('loading');

    if (!('geolocation' in navigator)) {
      fallbackToIp();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        resolveWithCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // Browser geolocation denied — try IP fallback
        fallbackToIp();
      },
      {timeout: 10000, maximumAge: 300000},
    );
  }, [resolveWithCoords, fallbackToIp]);

  return {status, coords, requestLocation};
}
