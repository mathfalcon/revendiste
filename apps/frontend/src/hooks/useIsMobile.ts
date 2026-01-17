import {useEffect, useState} from 'react';

/**
 * Detects if the user is on a mobile device
 * Works both server-side and client-side
 */
function checkIsMobile(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // Check for common mobile identifiers
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'iemobile',
    'opera mini',
    'mobile',
    'tablet',
  ];

  const isMobileUA = mobileKeywords.some(keyword =>
    userAgent.includes(keyword),
  );

  // Also check for touch support as a fallback
  const hasTouchScreen =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0;

  // Check screen width as additional heuristic
  const isSmallScreen = window.innerWidth <= 768;

  return isMobileUA || (hasTouchScreen && isSmallScreen);
}

/**
 * Hook to detect if the user is on a mobile device
 *
 * @returns boolean indicating if device is mobile
 */
export function useIsMobile() {
  // Initialize with the actual value to avoid hydration mismatch on mobile
  const [isMobile, setIsMobile] = useState(() => checkIsMobile());

  useEffect(() => {
    // Re-check on mount in case initial check was during SSR
    setIsMobile(checkIsMobile());

    // Also listen for resize in case of orientation changes
    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
