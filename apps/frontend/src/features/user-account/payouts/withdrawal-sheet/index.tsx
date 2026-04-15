import {useState, useCallback, useEffect} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {roundToDecimals} from '@revendiste/shared';
import {usePostHog} from 'posthog-js/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '~/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  requestPayoutMutation,
  getPayoutMethodsQuery,
  getAvailableEarningsQuery,
  getPayPalUyuFxPreviewQuery,
} from '~/lib/api/payouts';
import {PayoutType} from '~/lib/api/generated';
import type {EventTicketCurrency} from '@revendiste/shared';
import {PayoutMethodForm} from '../PayoutMethodForm';
import type {WithdrawalSheetProps} from './types';
import {useWithdrawalEarningsSelection} from './useWithdrawalEarningsSelection';
import {WithdrawalSelectStep} from './WithdrawalSelectStep';
import {WithdrawalConfirmStep} from './WithdrawalConfirmStep';

export type {WithdrawalSheetProps} from './types';

export function WithdrawalSheet({
  open,
  onOpenChange,
  initialCurrency,
}: WithdrawalSheetProps) {
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const {data: availableEarnings} = useQuery(getAvailableEarningsQuery());
  const {data: payoutMethods} = useQuery(getPayoutMethodsQuery());

  const [step, setStep] = useState<1 | 2>(1);
  const [currency, setCurrency] =
    useState<EventTicketCurrency>(initialCurrency);
  const [payoutMethodId, setPayoutMethodId] = useState<string>('');
  const [addMethodOpen, setAddMethodOpen] = useState(false);

  const {
    selectedListingIds,
    selectedTicketIds,
    listingGroups,
    filteredByListing,
    selectedTotal,
    selectedCount,
    allSelected,
    hasSelection,
    hasCurrencies,
    handleSelectAll,
    handleListingToggle,
    handleTicketToggle,
    resetSelection,
  } = useWithdrawalEarningsSelection(currency, availableEarnings);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setStep(1);
        resetSelection();
        setPayoutMethodId('');
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, resetSelection],
  );

  const handleCurrencyChange = useCallback((newCurrency: EventTicketCurrency) => {
    setCurrency(newCurrency);
  }, []);

  useEffect(() => {
    if (open) {
      setCurrency(initialCurrency);
    }
  }, [open, initialCurrency]);

  const compatibleMethods =
    payoutMethods?.filter(
      m => m.payoutType === PayoutType.Paypal || m.currency === currency,
    ) ?? [];

  const selectedMethod = compatibleMethods.find(m => m.id === payoutMethodId);
  const isPayPal = selectedMethod?.payoutType === PayoutType.Paypal;
  const showConversionAlert = isPayPal && currency === 'UYU';

  const fxPreviewQuery = useQuery({
    ...getPayPalUyuFxPreviewQuery(),
    enabled: open && step === 2 && showConversionAlert,
  });

  const estimatedUsdPayPal =
    fxPreviewQuery.data && selectedTotal > 0
      ? roundToDecimals(
          selectedTotal / fxPreviewQuery.data.effectiveUyuPerUsd,
          2,
        )
      : null;

  const fxPreviewBlocksConfirm =
    showConversionAlert &&
    (fxPreviewQuery.isPending ||
      fxPreviewQuery.isError ||
      !fxPreviewQuery.data);

  const handleContinue = () => {
    const defaultMethod =
      compatibleMethods.find(m => m.isDefault) ?? compatibleMethods[0];
    if (defaultMethod) {
      setPayoutMethodId(defaultMethod.id);
    }
    setStep(2);
  };

  const requestPayout = useMutation({
    ...requestPayoutMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['payouts']});
      handleOpenChange(false);
    },
  });

  const handleSubmit = async () => {
    await requestPayout.mutateAsync({
      payoutMethodId,
      listingTicketIds:
        selectedTicketIds.length > 0 ? selectedTicketIds : undefined,
      listingIds:
        selectedListingIds.length > 0 ? selectedListingIds : undefined,
    });
    posthog.capture('payout_requested', {
      payout_method_id: payoutMethodId,
      payout_type: selectedMethod?.payoutType,
      payout_currency: currency,
      listing_count: selectedListingIds.length,
      ticket_count: selectedTicketIds.length,
      total_amount: selectedTotal,
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side='right'
          className='w-full sm:max-w-lg flex flex-col p-0'
        >
          <SheetHeader className='px-6 pt-6 pb-4 border-b shrink-0'>
            <SheetTitle>
              {step === 1 ? 'Seleccionar ganancias' : 'Confirmar retiro'}
            </SheetTitle>
            <SheetDescription>
              {step === 1
                ? 'Elegí las ganancias que querés retirar'
                : 'Revisá los datos y confirmá tu retiro. Los retiros los procesamos manualmente en días hábiles (suele tardar 1 a 3 días hábiles).'}
            </SheetDescription>
          </SheetHeader>

          {step === 1 ? (
            <WithdrawalSelectStep
              currency={currency}
              hasCurrencies={hasCurrencies}
              onCurrencyChange={handleCurrencyChange}
              listingGroups={listingGroups}
              filteredByListingCount={filteredByListing.length}
              selectedListingIds={selectedListingIds}
              selectedTicketIds={selectedTicketIds}
              allSelected={allSelected}
              onSelectAll={handleSelectAll}
              onListingToggle={handleListingToggle}
              onTicketToggle={handleTicketToggle}
              selectedTotal={selectedTotal}
              selectedCount={selectedCount}
              hasSelection={hasSelection}
              onContinue={handleContinue}
            />
          ) : (
            <WithdrawalConfirmStep
              currency={currency}
              selectedTotal={selectedTotal}
              selectedCount={selectedCount}
              showConversionAlert={showConversionAlert}
              estimatedUsdPayPal={estimatedUsdPayPal}
              fxPreviewQuery={fxPreviewQuery}
              fxPreviewBlocksConfirm={fxPreviewBlocksConfirm}
              compatibleMethods={compatibleMethods}
              payoutMethodId={payoutMethodId}
              onPayoutMethodId={setPayoutMethodId}
              onAddMethod={() => setAddMethodOpen(true)}
              onSubmit={handleSubmit}
              onBack={() => setStep(1)}
              requestPayoutPending={requestPayout.isPending}
            />
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={addMethodOpen} onOpenChange={setAddMethodOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar método de pago</DialogTitle>
          </DialogHeader>
          <PayoutMethodForm
            onSuccess={() => {
              setAddMethodOpen(false);
              queryClient.invalidateQueries({
                queryKey: ['payouts', 'payout-methods'],
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
