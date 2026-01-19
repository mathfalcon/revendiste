import {useEffect} from 'react';
import {cn} from '~/lib/utils';
import {useStickyBar} from '~/contexts';

interface StickyBottomBarProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Whether to show only on mobile (hidden on md and above)
   * Default: true
   */
  mobileOnly?: boolean;
}

/**
 * A sticky bottom bar component for mobile-first purchase/action flows
 *
 * Features:
 * - Fixed to bottom of viewport
 * - Safe area inset for notched devices
 * - Optional mobile-only visibility
 * - Background blur effect
 * - Automatically registers with StickyBarContext for footer padding
 */
export function StickyBottomBar({
  children,
  className,
  mobileOnly = true,
}: StickyBottomBarProps) {
  const {registerStickyBar} = useStickyBar();

  // Register this sticky bar when mounted, unregister when unmounted
  useEffect(() => {
    const unregister = registerStickyBar();
    return unregister;
  }, [registerStickyBar]);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        mobileOnly && 'md:hidden',
      )}
    >
      <div
        className={cn(
          'bg-background/95 backdrop-blur-sm border-t shadow-lg safe-area-inset-bottom',
          className,
        )}
      >
        <div className='px-4 py-3'>{children}</div>
      </div>
    </div>
  );
}
