import {Skeleton} from '../ui/skeleton';

export const SkeletonEventCard = () => {
  return (
    <article className='w-full sm:w-[300px] sm:h-[524px] p-2 sm:p-2.5 bg-background shadow-sm rounded-lg'>
      <div className='flex flex-col h-full sm:justify-between sm:gap-3'>
        {/* Mobile: Image and Info side by side | Desktop: Image on top */}
        <div className='flex flex-row sm:flex-col gap-2 sm:gap-3'>
          {/* Image */}
          <Skeleton className='w-24 h-24 sm:w-full sm:h-[280px] shrink-0 rounded-lg' />

          {/* Info section */}
          <div className='flex flex-col flex-1 min-w-0 gap-1 sm:gap-2.5'>
            {/* Title */}
            <Skeleton className='w-full h-4 sm:h-5' />

            {/* Date with icon placeholder */}
            <Skeleton className='w-3/4 h-3 sm:h-4' />

            {/* Location - mobile only */}
            <Skeleton className='w-1/2 h-3 sm:hidden' />

            {/* Description - mobile (2 lines) */}
            <div className='flex flex-col gap-1 sm:hidden'>
              <Skeleton className='w-full h-2.5' />
              <Skeleton className='w-2/3 h-2.5' />
            </div>

            {/* Description - desktop (4 lines) */}
            <div className='hidden sm:flex flex-col gap-1 h-[64px]'>
              <Skeleton className='w-full h-3' />
              <Skeleton className='w-full h-3' />
              <Skeleton className='w-3/4 h-3' />
              <Skeleton className='w-1/2 h-3' />
            </div>

            {/* Desktop: Separator and Venue section */}
            <div className='hidden sm:flex flex-col gap-2'>
              <Skeleton className='h-[1px] w-full' />
              <Skeleton className='w-32 h-4' />
              <Skeleton className='h-[1px] w-full' />
            </div>
          </div>
        </div>

        {/* Mobile: Full-width Separator */}
        <Skeleton className='h-[1px] w-full my-2 sm:hidden' />

        {/* Price/Status and Button */}
        <div className='flex justify-between items-center gap-2'>
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-8 w-20 rounded-md' />
        </div>
      </div>
    </article>
  );
};
