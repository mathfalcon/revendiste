import {Skeleton} from '../ui/skeleton';

export const SkeletonEventCard = () => {
  return (
    <div className='w-full sm:w-[300px] sm:h-[524px] flex flex-row sm:flex-col gap-2 sm:gap-3 bg-background p-2 sm:p-2.5 shadow-sm rounded-lg sm:justify-between'>
      {/* Mobile: Image on left */}
      <Skeleton className='w-24 h-24 sm:w-full sm:h-[280px] shrink-0 rounded-lg' />

      {/* Desktop: Image on top */}
      <div className='flex flex-col flex-1 sm:flex-none min-w-0 sm:w-full gap-1 sm:gap-3'>
        <div className='flex flex-col gap-1 sm:gap-3'>
          <Skeleton className='w-full h-4 sm:h-[24px]' />
          <Skeleton className='w-full h-3 sm:h-[16px]' />
        </div>

        <div className='hidden sm:flex flex-col gap-3'>
          <Skeleton className='h-[38px] justify-self-end' />
          <Skeleton className='h-[36px] justify-self-end' />
        </div>
      </div>

      {/* Mobile: Bottom section */}
      <div className='flex flex-col justify-end gap-2 sm:hidden'>
        <Skeleton className='h-[1px] w-full' />
        <Skeleton className='h-[36px] w-full' />
      </div>
    </div>
  );
};
