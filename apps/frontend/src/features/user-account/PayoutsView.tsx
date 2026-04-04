import {useState, Suspense} from 'react';
import {useQuery} from '@tanstack/react-query';
import {getBalanceQuery, getAvailableEarningsQuery} from '~/lib/api/payouts';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '~/components/ui/tabs';
import {Skeleton} from '~/components/ui/skeleton';
import {Clock, CreditCard} from 'lucide-react';
import {BalanceHero} from './payouts/BalanceHero';
import {WithdrawalSheet} from './payouts/WithdrawalSheet';
import {PayoutHistorySection} from './payouts/PayoutHistorySection';
import {PayoutMethodsSection} from './payouts/PayoutMethodsSection';
import {PayoutDetailsModal} from './payouts/PayoutDetailsModal';
import type {EventTicketCurrency} from '@revendiste/shared';

function BalanceHeroSkeleton() {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
      {[1, 2].map(i => (
        <div key={i} className='rounded-lg border p-5 space-y-3'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-9 w-40' />
          <Skeleton className='h-4 w-48' />
          <Skeleton className='h-9 w-full' />
        </div>
      ))}
    </div>
  );
}

export function PayoutsView() {
  const {data: balance, isPending: balancePending} =
    useQuery(getBalanceQuery());
  // Prefetch available earnings so the sheet opens instantly
  useQuery(getAvailableEarningsQuery());

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetCurrency, setSheetCurrency] =
    useState<EventTicketCurrency>('UYU');

  const handleWithdraw = (currency: EventTicketCurrency) => {
    setSheetCurrency(currency);
    setSheetOpen(true);
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold'>Retiros</h2>
        <p className='text-muted-foreground'>
          Gestioná tus ganancias y retirá tu dinero
        </p>
      </div>

      {/* Balance Hero */}
      {balancePending || !balance ? (
        <BalanceHeroSkeleton />
      ) : (
        <BalanceHero
          available={balance.available}
          retained={balance.retained}
          pending={balance.pending}
          payoutPending={balance.payoutPending}
          paidOut={balance.paidOut}
          total={balance.total}
          onWithdraw={handleWithdraw}
        />
      )}

      {/* Tabs: History & Methods */}
      <Tabs defaultValue='history'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='history' className='flex items-center gap-2'>
            <Clock className='h-4 w-4' />
            Historial
          </TabsTrigger>
          <TabsTrigger value='methods' className='flex items-center gap-2'>
            <CreditCard className='h-4 w-4' />
            <span className='hidden sm:inline'>Métodos de pago</span>
            <span className='sm:hidden'>Métodos</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value='history' className='mt-4'>
          <PayoutHistorySection />
        </TabsContent>
        <TabsContent value='methods' className='mt-4'>
          <PayoutMethodsSection />
        </TabsContent>
      </Tabs>

      {/* Withdrawal Sheet */}
      <WithdrawalSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialCurrency={sheetCurrency}
      />

      {/* Payout Details Modal */}
      <Suspense fallback={null}>
        <PayoutDetailsModal />
      </Suspense>
    </div>
  );
}
