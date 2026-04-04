import {useState, useMemo, useCallback, useEffect} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {usePostHog} from 'posthog-js/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '~/components/ui/sheet';
import {Button} from '~/components/ui/button';
import {Checkbox} from '~/components/ui/checkbox';
import {Alert, AlertDescription} from '~/components/ui/alert';
import {Separator} from '~/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Check,
  Info,
  Loader2,
  Plus,
  Banknote,
  DollarSign,
} from 'lucide-react';
import {cn} from '~/lib/utils';
import {formatCurrency, formatEventDate} from '~/utils';
import {
  requestPayoutMutation,
  getPayoutMethodsQuery,
  getAvailableEarningsQuery,
} from '~/lib/api/payouts';
import {PayoutType} from '~/lib/api/generated';
import type {EventTicketCurrency} from '@revendiste/shared';
import {getPayoutMethodDropdownText} from './payout-method-utils';
import {PayoutMethodForm} from './PayoutMethodForm';

interface WithdrawalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCurrency: EventTicketCurrency;
}

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
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [payoutMethodId, setPayoutMethodId] = useState<string>('');
  const [addMethodOpen, setAddMethodOpen] = useState(false);

  // Reset state when sheet opens/closes or currency changes
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setStep(1);
        setSelectedListingIds([]);
        setSelectedTicketIds([]);
        setPayoutMethodId('');
      }
      onOpenChange(isOpen);
    },
    [onOpenChange],
  );

  // Reset selections when currency changes
  const handleCurrencyChange = useCallback(
    (newCurrency: EventTicketCurrency) => {
      setCurrency(newCurrency);
      setSelectedListingIds([]);
      setSelectedTicketIds([]);
    },
    [],
  );

  // Sync initial currency when sheet opens
  useEffect(() => {
    if (open) {
      setCurrency(initialCurrency);
    }
  }, [open, initialCurrency]);

  // Filter earnings by selected currency
  const filteredByListing = useMemo(
    () =>
      availableEarnings?.byListing.filter(l => l.currency === currency) ?? [],
    [availableEarnings, currency],
  );

  const filteredByTicket = useMemo(
    () =>
      availableEarnings?.byTicket.filter(t => t.currency === currency) ?? [],
    [availableEarnings, currency],
  );

  // Group tickets by listing for hierarchical display
  const listingGroups = useMemo(() => {
    return filteredByListing.map(listing => ({
      ...listing,
      tickets: filteredByTicket.filter(t => t.listingId === listing.listingId),
    }));
  }, [filteredByListing, filteredByTicket]);

  // Calculate total selected amount
  const selectedTotal = useMemo(() => {
    let total = 0;

    // Add listing totals
    selectedListingIds.forEach(id => {
      const listing = filteredByListing.find(l => l.listingId === id);
      if (listing) total += parseFloat(listing.totalAmount);
    });

    // Add individual ticket amounts (only for tickets whose listing is NOT selected)
    selectedTicketIds.forEach(id => {
      const ticket = filteredByTicket.find(t => t.listingTicketId === id);
      if (ticket && !selectedListingIds.includes(ticket.listingId)) {
        total += parseFloat(ticket.sellerAmount);
      }
    });

    return total;
  }, [
    selectedListingIds,
    selectedTicketIds,
    filteredByListing,
    filteredByTicket,
  ]);

  const selectedCount = useMemo(() => {
    let count = 0;
    selectedListingIds.forEach(id => {
      const listing = filteredByListing.find(l => l.listingId === id);
      if (listing) count += listing.ticketCount;
    });
    selectedTicketIds.forEach(id => {
      const ticket = filteredByTicket.find(t => t.listingTicketId === id);
      if (ticket && !selectedListingIds.includes(ticket.listingId)) {
        count += 1;
      }
    });
    return count;
  }, [
    selectedListingIds,
    selectedTicketIds,
    filteredByListing,
    filteredByTicket,
  ]);

  // Select all / deselect all
  const allSelected =
    filteredByListing.length > 0 &&
    filteredByListing.every(l => selectedListingIds.includes(l.listingId));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedListingIds([]);
      setSelectedTicketIds([]);
    } else {
      setSelectedListingIds(filteredByListing.map(l => l.listingId));
      setSelectedTicketIds([]);
    }
  };

  // Listing toggle
  const handleListingToggle = (listingId: string) => {
    setSelectedListingIds(prev => {
      if (prev.includes(listingId)) {
        return prev.filter(id => id !== listingId);
      }
      // Selecting listing — deselect its individual tickets
      const ticketsInListing = filteredByTicket
        .filter(t => t.listingId === listingId)
        .map(t => t.listingTicketId);
      setSelectedTicketIds(current =>
        current.filter(id => !ticketsInListing.includes(id)),
      );
      return [...prev, listingId];
    });
  };

  // Ticket toggle
  const handleTicketToggle = (ticketId: string) => {
    setSelectedTicketIds(prev => {
      if (prev.includes(ticketId)) {
        return prev.filter(id => id !== ticketId);
      }
      // Selecting ticket — if its listing is selected, remove the listing
      const ticket = filteredByTicket.find(t => t.listingTicketId === ticketId);
      if (ticket && selectedListingIds.includes(ticket.listingId)) {
        setSelectedListingIds(current =>
          current.filter(id => id !== ticket.listingId),
        );
      }
      return [...prev, ticketId];
    });
  };

  // Compatible payout methods for selected currency
  const compatibleMethods = useMemo(
    () =>
      payoutMethods?.filter(
        m => m.payoutType === PayoutType.Paypal || m.currency === currency,
      ) ?? [],
    [payoutMethods, currency],
  );

  const selectedMethod = compatibleMethods.find(m => m.id === payoutMethodId);
  const isPayPal = selectedMethod?.payoutType === PayoutType.Paypal;
  const showConversionAlert = isPayPal && currency === 'UYU';

  // Auto-select default method when entering step 2
  const handleContinue = () => {
    const defaultMethod =
      compatibleMethods.find(m => m.isDefault) ?? compatibleMethods[0];
    if (defaultMethod) {
      setPayoutMethodId(defaultMethod.id);
    }
    setStep(2);
  };

  // Submit mutation
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

  const hasSelection =
    selectedListingIds.length > 0 || selectedTicketIds.length > 0;
  const hasCurrencies = {
    UYU: availableEarnings?.byListing.some(l => l.currency === 'UYU') ?? false,
    USD: availableEarnings?.byListing.some(l => l.currency === 'USD') ?? false,
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
                : 'Revisá los datos y confirmá tu retiro'}
            </SheetDescription>
          </SheetHeader>

          {step === 1 ? (
            <>
              {/* Currency selector — card buttons */}
              <div className='px-6 pt-4 shrink-0 space-y-3'>
                <p className='text-sm font-medium'>Moneda</p>
                <div className='grid grid-cols-2 gap-3'>
                  {(
                    [
                      {value: 'UYU', label: 'Pesos', icon: Banknote},
                      {value: 'USD', label: 'Dólares', icon: DollarSign},
                    ] as const
                  ).map(({value, label, icon: Icon}) => (
                    <button
                      key={value}
                      type='button'
                      onClick={() => handleCurrencyChange(value)}
                      disabled={!hasCurrencies[value]}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors',
                        currency === value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:bg-muted/50',
                        !hasCurrencies[value] &&
                          'opacity-40 cursor-not-allowed',
                      )}
                    >
                      <Icon className='h-5 w-5' />
                      <span className='text-sm font-medium'>
                        {value} · {label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Select all */}
                {filteredByListing.length > 0 && (
                  <label className='flex items-center gap-2 cursor-pointer py-1'>
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className='text-sm font-medium'>
                      Seleccionar todo
                    </span>
                  </label>
                )}
              </div>

              <Separator />

              {/* Earnings list */}
              <div className='flex-1 overflow-y-auto px-6 py-4'>
                {listingGroups.length === 0 ? (
                  <div className='flex flex-col items-center justify-center h-full text-center'>
                    <p className='text-muted-foreground'>
                      No tenés ganancias disponibles en {currency}
                    </p>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {listingGroups.map(group => {
                      const isListingSelected = selectedListingIds.includes(
                        group.listingId,
                      );
                      const hasIndividualSelections = group.tickets.some(t =>
                        selectedTicketIds.includes(t.listingTicketId),
                      );

                      return (
                        <Collapsible key={group.listingId}>
                          <div
                            className={cn(
                              'rounded-lg border transition-colors',
                              isListingSelected || hasIndividualSelections
                                ? 'border-primary/30 bg-primary/5'
                                : '',
                            )}
                          >
                            {/* Listing header */}
                            <div className='flex items-center gap-3 p-3'>
                              <Checkbox
                                checked={isListingSelected}
                                onCheckedChange={() =>
                                  handleListingToggle(group.listingId)
                                }
                              />
                              <div className='flex-1 min-w-0'>
                                <p className='text-sm font-medium truncate'>
                                  {group.eventName}
                                </p>
                                <p className='text-xs text-muted-foreground'>
                                  {formatEventDate(
                                    new Date(group.eventStartDate),
                                  )}{' '}
                                  · {group.ticketCount} entrada
                                  {group.ticketCount !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <span className='text-sm font-semibold whitespace-nowrap'>
                                {formatCurrency(group.totalAmount, currency)}
                              </span>
                              {group.tickets.length > 1 && (
                                <CollapsibleTrigger asChild>
                                  <button className='p-1 hover:bg-muted rounded transition-colors'>
                                    <ChevronDown className='h-4 w-4 text-muted-foreground' />
                                  </button>
                                </CollapsibleTrigger>
                              )}
                            </div>

                            {/* Individual tickets (expandable) */}
                            {group.tickets.length > 1 && (
                              <CollapsibleContent>
                                <div className='border-t px-3 pb-3 pt-1'>
                                  {group.tickets.map((ticket, idx) => {
                                    const isTicketSelected =
                                      selectedTicketIds.includes(
                                        ticket.listingTicketId,
                                      );
                                    return (
                                      <label
                                        key={ticket.id}
                                        className='flex items-center gap-3 py-2 cursor-pointer'
                                      >
                                        <Checkbox
                                          checked={
                                            isListingSelected ||
                                            isTicketSelected
                                          }
                                          disabled={isListingSelected}
                                          onCheckedChange={() =>
                                            handleTicketToggle(
                                              ticket.listingTicketId,
                                            )
                                          }
                                        />
                                        <span className='text-sm text-muted-foreground flex-1'>
                                          Entrada #{idx + 1}
                                        </span>
                                        <span className='text-sm font-medium'>
                                          {formatCurrency(
                                            ticket.sellerAmount,
                                            currency,
                                          )}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </CollapsibleContent>
                            )}
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sticky footer — Step 1 */}
              <div className='border-t bg-background px-6 py-4 shrink-0'>
                <div className='flex items-center justify-between mb-3'>
                  <div>
                    <p className='text-sm text-muted-foreground'>
                      Total a retirar
                    </p>
                    <p className='text-xl font-bold'>
                      {formatCurrency(String(selectedTotal), currency)}
                    </p>
                  </div>
                  {selectedCount > 0 && (
                    <p className='text-sm text-muted-foreground'>
                      {selectedCount} entrada{selectedCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={!hasSelection}
                  className='w-full'
                >
                  Continuar
                  <ArrowRight className='h-4 w-4 ml-1.5' />
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Confirm */}
              <div className='flex-1 overflow-y-auto px-6 py-4 space-y-5'>
                {/* Summary card */}
                <div className='rounded-lg border bg-card p-4 space-y-3'>
                  <p className='text-sm font-medium'>Resumen del retiro</p>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-muted-foreground'>
                        Monto a retirar
                      </span>
                      <span className='text-lg font-bold'>
                        {formatCurrency(String(selectedTotal), currency)}
                      </span>
                    </div>
                    <div className='flex justify-between items-center text-sm border-t pt-2'>
                      <span className='text-muted-foreground'>
                        Entradas incluidas
                      </span>
                      <span className='font-medium'>{selectedCount}</span>
                    </div>
                    <div className='flex justify-between items-center text-sm border-t pt-2'>
                      <span className='text-muted-foreground'>Moneda</span>
                      <span className='font-medium'>{currency}</span>
                    </div>
                  </div>
                </div>

                {/* Payout method selection */}
                <div className='space-y-2'>
                  <p className='text-sm font-medium'>Método de retiro</p>
                  {compatibleMethods.length === 0 ? (
                    <div className='rounded-lg border border-dashed p-4 text-center space-y-3'>
                      <p className='text-sm text-muted-foreground'>
                        No tenés métodos compatibles con {currency}
                      </p>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setAddMethodOpen(true)}
                      >
                        <Plus className='h-4 w-4 mr-1.5' />
                        Agregar método
                      </Button>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {compatibleMethods.map(method => (
                        <button
                          key={method.id}
                          type='button'
                          onClick={() => setPayoutMethodId(method.id)}
                          className={cn(
                            'w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                            payoutMethodId === method.id
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'hover:bg-muted/50',
                          )}
                        >
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium truncate'>
                              {getPayoutMethodDropdownText(method)}
                            </p>
                            {method.isDefault && (
                              <p className='text-xs text-muted-foreground'>
                                Por defecto
                              </p>
                            )}
                          </div>
                          {payoutMethodId === method.id && (
                            <Check className='h-4 w-4 text-primary shrink-0' />
                          )}
                        </button>
                      ))}
                      <button
                        type='button'
                        onClick={() => setAddMethodOpen(true)}
                        className='text-sm text-primary hover:underline'
                      >
                        + Agregar otro método
                      </button>
                    </div>
                  )}
                </div>

                {/* Conversion alert */}
                {showConversionAlert && (
                  <Alert>
                    <Info className='h-4 w-4' />
                    <AlertDescription>
                      Tus ganancias en UYU se convertirán a USD al tipo de
                      cambio vigente al momento de procesar el retiro.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Sticky footer — Step 2 */}
              <div className='border-t bg-background px-6 py-4 shrink-0 space-y-3'>
                <Button
                  onClick={handleSubmit}
                  disabled={!payoutMethodId || requestPayout.isPending}
                  className='w-full'
                >
                  {requestPayout.isPending ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-1.5 animate-spin' />
                      Procesando...
                    </>
                  ) : (
                    `Confirmar retiro · ${formatCurrency(String(selectedTotal), currency)}`
                  )}
                </Button>
                <Button
                  variant='ghost'
                  onClick={() => setStep(1)}
                  className='w-full'
                  disabled={requestPayout.isPending}
                >
                  <ArrowLeft className='h-4 w-4 mr-1.5' />
                  Volver a seleccionar
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add payout method dialog (inline from sheet) */}
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
