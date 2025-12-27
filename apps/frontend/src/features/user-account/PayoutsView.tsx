import {useState, Suspense} from 'react';
import {useQuery} from '@tanstack/react-query';
import {getBalanceQuery, getAvailableEarningsQuery} from '~/lib/api/payouts';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {Card, CardContent} from '~/components/ui/card';
import {BalanceSection} from './payouts/BalanceSection';
import {EarningsSelectionSection} from './payouts/EarningsSelectionSection';
import {RequestPayoutForm} from './payouts/RequestPayoutForm';
import {PayoutHistorySection} from './payouts/PayoutHistorySection';
import {PayoutMethodsSection} from './payouts/PayoutMethodsSection';
import {PayoutDetailsModal} from './payouts/PayoutDetailsModal';
import {Wallet, DollarSign, History, CreditCard} from 'lucide-react';

export function PayoutsView() {
  const {data: balance, isPending: balancePending} =
    useQuery(getBalanceQuery());
  const {data: availableEarnings, isPending: earningsPending} = useQuery(
    getAvailableEarningsQuery(),
  );

  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [accordionValue, setAccordionValue] = useState<string[]>([
    'balance',
    'earnings',
    'history',
    'methods',
  ]);

  const handleListingToggle = (listingId: string) => {
    setSelectedListingIds(prev => {
      const isSelected = prev.includes(listingId);

      if (isSelected) {
        // Deselecting listing - just remove it
        return prev.filter(id => id !== listingId);
      } else {
        // Selecting listing - remove all tickets that belong to this listing
        if (availableEarnings) {
          const ticketsInListing = availableEarnings.byTicket
            .filter(ticket => ticket.listingId === listingId)
            .map(ticket => ticket.listingTicketId);

          setSelectedTicketIds(current =>
            current.filter(id => !ticketsInListing.includes(id)),
          );
        }
        return [...prev, listingId];
      }
    });
  };

  const handleTicketToggle = (ticketId: string) => {
    setSelectedTicketIds(prev => {
      const isSelected = prev.includes(ticketId);

      if (isSelected) {
        // Deselecting ticket - just remove it
        return prev.filter(id => id !== ticketId);
      } else {
        // Selecting ticket - if its listing is selected, remove the listing
        if (availableEarnings) {
          const ticket = availableEarnings.byTicket.find(
            t => t.listingTicketId === ticketId,
          );

          if (ticket && selectedListingIds.includes(ticket.listingId)) {
            setSelectedListingIds(current =>
              current.filter(id => id !== ticket.listingId),
            );
          }
        }
        return [...prev, ticketId];
      }
    });
  };

  const handlePayoutSuccess = () => {
    setSelectedListingIds([]);
    setSelectedTicketIds([]);
    // Open historial section to show the new payout
    setAccordionValue(prev => {
      if (Array.isArray(prev)) {
        return prev.includes('history') ? prev : [...prev, 'history'];
      }
      return ['history'];
    });
  };

  if (balancePending || earningsPending) {
    return (
      <Card className='w-full'>
        <CardContent className='flex h-96 items-center justify-center'>
          <LoadingSpinner size={96} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold'>Payouts</h2>
        <p className='text-muted-foreground'>
          Gestiona tus ganancias y solicita pagos
        </p>
      </div>

      <Accordion
        type='multiple'
        value={accordionValue}
        onValueChange={setAccordionValue}
        className='w-full flex flex-col gap-4'
      >
        {/* Balance Section */}
        <Card>
          <AccordionItem value='balance' className='border-none'>
            <AccordionTrigger className='rounded-t-lg border-b bg-card px-4 py-3 hover:no-underline'>
              <div className='flex items-center gap-2'>
                <Wallet className='h-4 w-4 text-blue-500' />
                <span className='font-semibold'>Balance</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className='px-4 pb-4 pt-0'>
              {balance && (
                <div className='pt-4'>
                  <BalanceSection
                    available={balance.available}
                    retained={balance.retained}
                    pending={balance.pending}
                    total={balance.total}
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Card>

        {/* Available Earnings & Request Payout */}
        <Card>
          <AccordionItem value='earnings' className='border-none'>
            <AccordionTrigger className='rounded-t-lg border-b bg-card px-4 py-3 hover:no-underline'>
              <div className='flex items-center gap-2'>
                <DollarSign className='h-4 w-4 text-green-500' />
                <span className='font-semibold'>Solicitar Pago</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className='px-4 pb-4 pt-0 space-y-6'>
              {availableEarnings && (
                <>
                  <div className='pt-4'>
                    <EarningsSelectionSection
                      byListing={availableEarnings.byListing}
                      byTicket={availableEarnings.byTicket}
                      selectedListingIds={selectedListingIds}
                      selectedTicketIds={selectedTicketIds}
                      onListingToggle={handleListingToggle}
                      onTicketToggle={handleTicketToggle}
                    />
                  </div>
                  <div className='border-t pt-4'>
                    <RequestPayoutForm
                      selectedListingIds={selectedListingIds}
                      selectedTicketIds={selectedTicketIds}
                      availableEarnings={availableEarnings}
                      onSuccess={handlePayoutSuccess}
                    />
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Card>

        {/* Payout History */}
        <Card>
          <AccordionItem value='history' className='border-none'>
            <AccordionTrigger className='rounded-t-lg border-b bg-card px-4 py-3 hover:no-underline'>
              <div className='flex items-center gap-2'>
                <History className='h-4 w-4 text-purple-500' />
                <span className='font-semibold'>Historial</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className='px-4 pb-4 pt-0'>
              <div className='pt-4'>
                <PayoutHistorySection />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Card>

        {/* Payout Methods */}
        <Card>
          <AccordionItem value='methods' className='border-none'>
            <AccordionTrigger className='rounded-t-lg border-b bg-card px-4 py-3 hover:no-underline'>
              <div className='flex items-center gap-2'>
                <CreditCard className='h-4 w-4 text-orange-500' />
                <span className='font-semibold'>Métodos de Pago</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className='px-4 pb-4 pt-0'>
              <div className='pt-4'>
                <PayoutMethodsSection />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Card>
      </Accordion>

      {/* Payout Details Modal */}
      <Suspense fallback={null}>
        <PayoutDetailsModal />
      </Suspense>
    </div>
  );
}
