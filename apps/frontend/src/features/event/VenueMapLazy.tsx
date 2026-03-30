import {lazy, Suspense} from 'react';
import {Skeleton} from '~/components/ui/skeleton';

const VenueMap = lazy(() =>
  import('./VenueMap').then(mod => ({default: mod.VenueMap})),
);

interface VenueMapLazyProps {
  latitude: number;
  longitude: number;
  venueName: string | null;
  venueAddress: string | null;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export const VenueMapLazy = (props: VenueMapLazyProps) => {
  return (
    <Suspense
      fallback={
        <Skeleton className='w-full h-[160px] md:h-[200px] rounded-lg' />
      }
    >
      <VenueMap {...props} />
    </Suspense>
  );
};
