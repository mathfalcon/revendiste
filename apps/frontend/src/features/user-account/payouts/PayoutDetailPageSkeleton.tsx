import {Skeleton} from '~/components/ui/skeleton';
import {Card, CardContent, CardHeader} from '~/components/ui/card';

/** Shown while the payout detail route loader is pending (replaces default FullScreenLoading). */
export function PayoutDetailPageSkeleton() {
  return (
    <div className='space-y-6' aria-busy='true' aria-label='Cargando retiro'>
      <Skeleton className='h-4 w-40' />
      <div className='space-y-2'>
        <Skeleton className='h-8 w-48 max-w-full' />
        <Skeleton className='h-4 w-full max-w-xl' />
      </div>
      <PayoutDetailContentSkeleton />
    </div>
  );
}

/** Shown when the page header is already visible but payout data is still loading. */
export function PayoutDetailContentSkeleton() {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-[1fr_min(300px,100%)] gap-4 items-start'>
      <div className='space-y-4 min-w-0 order-2 lg:order-1'>
        <Card className='overflow-hidden'>
          <CardHeader className='pb-2'>
            <Skeleton className='h-4 w-28' />
          </CardHeader>
          <CardContent className='p-4 space-y-3'>
            <Skeleton className='h-16 w-full rounded-md' />
            <Skeleton className='h-16 w-full rounded-md sm:max-w-[calc(50%-0.375rem)]' />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <Skeleton className='h-4 w-40' />
          </CardHeader>
          <CardContent className='space-y-2'>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className='h-12 w-full rounded-md' />
            ))}
          </CardContent>
        </Card>
      </div>
      <div className='lg:sticky lg:top-4 space-y-3 order-1 lg:order-2'>
        <Card>
          <CardContent className='p-4 space-y-4'>
            <div className='flex items-start gap-3'>
              <Skeleton className='h-9 w-9 shrink-0 rounded-lg' />
              <div className='min-w-0 flex-1 space-y-2'>
                <Skeleton className='h-4 w-36' />
                <Skeleton className='h-3 w-20' />
              </div>
            </div>
            <Skeleton className='h-7 w-24 rounded-md' />
            <Skeleton className='h-[4.5rem] w-full rounded-lg' />
            <div className='space-y-2.5 pt-1 border-t'>
              <Skeleton className='h-3 w-32' />
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className='h-4 w-full max-w-full' />
              ))}
            </div>
            <div className='space-y-2.5 pt-1 border-t'>
              <Skeleton className='h-3 w-28' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
