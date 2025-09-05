import {Skeleton} from '../ui/skeleton';

export const SkeletonEventCard = () => {
  return (
    <div className='w-[300px] h-[524px] flex flex-col gap-3 bg-background p-2.5 shadow-sm rounded-lg justify-between'>
      <div className='flex flex-col gap-3'>
        <Skeleton className='w-full h-[280px]' />
        <Skeleton className='w-full h-[24px]' />
        <Skeleton className='w-full h-[16px]' />
      </div>

      <div className='flex flex-col gap-3'>
        <Skeleton className='h-[38px] justify-self-end' />
        <Skeleton className='h-[36px] justify-self-end' />
      </div>
    </div>
  );
};
