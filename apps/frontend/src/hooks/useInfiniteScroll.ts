import {useEffect, useRef} from 'react';

interface UseInfiniteScrollOptions {
  /**
   * Whether there are more pages to load
   */
  hasNextPage: boolean;
  /**
   * Whether the next page is currently being fetched
   */
  isFetchingNextPage: boolean;
  /**
   * Function to fetch the next page
   */
  fetchNextPage: () => void;
  /**
   * Root margin for the Intersection Observer (default: '100px')
   */
  rootMargin?: string;
  /**
   * Threshold for the Intersection Observer (default: 0.1)
   */
  threshold?: number;
  /**
   * Whether the hook is enabled (default: true)
   */
  enabled?: boolean;
}

/**
 * Hook to handle infinite scroll functionality using Intersection Observer
 * @returns A ref to attach to a sentinel element
 */
export const useInfiniteScroll = ({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = '100px',
  threshold = 0.1,
  enabled = true,
}: UseInfiniteScrollOptions) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [
    enabled,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin,
    threshold,
  ]);

  return sentinelRef;
};
