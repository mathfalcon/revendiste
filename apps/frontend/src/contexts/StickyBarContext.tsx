import {createContext, useContext, useState, useCallback, useMemo} from 'react';

interface StickyBarContextValue {
  hasStickyBar: boolean;
  registerStickyBar: () => () => void;
}

const StickyBarContext = createContext<StickyBarContextValue | null>(null);

export function StickyBarProvider({children}: {children: React.ReactNode}) {
  const [count, setCount] = useState(0);

  const registerStickyBar = useCallback(() => {
    setCount(c => c + 1);
    // Return cleanup function
    return () => setCount(c => c - 1);
  }, []);

  const value = useMemo(
    () => ({
      hasStickyBar: count > 0,
      registerStickyBar,
    }),
    [count, registerStickyBar],
  );

  return (
    <StickyBarContext.Provider value={value}>
      {children}
    </StickyBarContext.Provider>
  );
}

export function useStickyBar() {
  const context = useContext(StickyBarContext);
  if (!context) {
    throw new Error('useStickyBar must be used within a StickyBarProvider');
  }
  return context;
}

/**
 * Hook to check if there's an active sticky bar.
 * Safe to use outside of provider (returns false).
 */
export function useHasStickyBar() {
  const context = useContext(StickyBarContext);
  return context?.hasStickyBar ?? false;
}
