import {Link} from '@tanstack/react-router';
import {useQuery} from '@tanstack/react-query';
import {ArrowLeft} from 'lucide-react';
import {getPayoutDetailsQuery} from '~/lib/api/payouts';
import {PayoutDetailContent} from './PayoutDetailContent';
import {PayoutDetailContentSkeleton} from './PayoutDetailPageSkeleton';
import {Button} from '~/components/ui/button';

export function PayoutDetailPage({payoutId}: {payoutId: string}) {
  const {data: payout, isPending, isError} = useQuery(
    getPayoutDetailsQuery(payoutId),
  );

  return (
    <div className='space-y-6'>
      <Link
        to='/cuenta/retiro'
        className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      >
        <ArrowLeft className='h-4 w-4 shrink-0' aria-hidden />
        Volver a retiros
      </Link>

      <div>
        <h2 className='text-2xl font-semibold'>Tu retiro</h2>
        <p className='text-muted-foreground'>
          Estado, comprobantes y todo lo que necesitás saber de este retiro.
        </p>
      </div>

      {isPending ? (
        <PayoutDetailContentSkeleton />
      ) : isError || !payout ? (
        <div className='rounded-lg border border-dashed p-8 text-center space-y-4'>
          <p className='text-muted-foreground'>
            No pudimos cargar este retiro. Puede que no exista o que no tengas
            acceso.
          </p>
          <Button variant='outline' asChild>
            <Link to='/cuenta/retiro'>Volver a retiros</Link>
          </Button>
        </div>
      ) : (
        <PayoutDetailContent payout={payout} />
      )}
    </div>
  );
}
