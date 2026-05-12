import {Button} from '~/components/ui/button';
import {Checkbox} from '~/components/ui/checkbox';
import {Separator} from '~/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import {ArrowRight, ChevronDown, Banknote, DollarSign} from 'lucide-react';
import {cn} from '~/lib/utils';
import {formatCurrency, formatEventDate} from '~/utils';
import type {EventTicketCurrency} from '@revendiste/shared';
import type {WithdrawalListingGroup} from './types';

interface WithdrawalSelectStepProps {
  currency: EventTicketCurrency;
  hasCurrencies: {UYU: boolean; USD: boolean};
  onCurrencyChange: (c: EventTicketCurrency) => void;
  listingGroups: WithdrawalListingGroup[];
  filteredByListingCount: number;
  selectedListingIds: string[];
  selectedTicketIds: string[];
  allSelected: boolean;
  onSelectAll: () => void;
  onListingToggle: (listingId: string) => void;
  onTicketToggle: (ticketId: string) => void;
  selectedTotal: number;
  selectedCount: number;
  hasSelection: boolean;
  onContinue: () => void;
}

export function WithdrawalSelectStep({
  currency,
  hasCurrencies,
  onCurrencyChange,
  listingGroups,
  filteredByListingCount,
  selectedListingIds,
  selectedTicketIds,
  allSelected,
  onSelectAll,
  onListingToggle,
  onTicketToggle,
  selectedTotal,
  selectedCount,
  hasSelection,
  onContinue,
}: WithdrawalSelectStepProps) {
  return (
    <>
      <div className='px-6 pt-4 shrink-0 space-y-3'>
        <p className='text-sm font-medium'>Moneda</p>
        <div className='grid grid-cols-2 gap-3'>
          {(
            [
              {value: 'UYU' as const, label: 'Pesos', icon: Banknote},
              {value: 'USD' as const, label: 'Dólares', icon: DollarSign},
            ] as const
          ).map(({value, label, icon: Icon}) => (
            <button
              key={value}
              type='button'
              onClick={() => onCurrencyChange(value)}
              disabled={!hasCurrencies[value]}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors',
                currency === value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'hover:bg-muted/50',
                !hasCurrencies[value] && 'opacity-40 cursor-not-allowed',
              )}
            >
              <Icon className='h-5 w-5' />
              <span className='text-sm font-medium'>
                {value} · {label}
              </span>
            </button>
          ))}
        </div>

        {filteredByListingCount > 0 && (
          <label className='flex items-center gap-2 cursor-pointer py-1'>
            <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
            <span className='text-sm font-medium'>Seleccionar todo</span>
          </label>
        )}
      </div>

      <Separator />

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
                    <div
                      className='flex items-center gap-3 p-3 cursor-pointer select-none'
                      onClick={() => onListingToggle(group.listingId)}
                    >
                      <Checkbox
                        checked={isListingSelected}
                        onCheckedChange={() => onListingToggle(group.listingId)}
                        onClick={e => e.stopPropagation()}
                      />
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>
                          {group.eventName}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {formatEventDate(new Date(group.eventStartDate))} ·{' '}
                          {group.ticketCount} entrada
                          {group.ticketCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className='text-sm font-semibold whitespace-nowrap'>
                        {formatCurrency(group.totalAmount, currency)}
                      </span>
                      {group.tickets.length > 1 && (
                        <CollapsibleTrigger asChild>
                          <button
                            type='button'
                            className='p-1 hover:bg-muted rounded transition-colors shrink-0'
                            onClick={e => e.stopPropagation()}
                            aria-label='Ver entradas'
                          >
                            <ChevronDown className='h-4 w-4 text-muted-foreground' />
                          </button>
                        </CollapsibleTrigger>
                      )}
                    </div>

                    {group.tickets.length > 1 && (
                      <CollapsibleContent>
                        <div className='border-t px-3 pb-3 pt-1'>
                          {group.tickets.map((ticket, idx) => {
                            const isTicketSelected = selectedTicketIds.includes(
                              ticket.listingTicketId,
                            );
                            return (
                              <label
                                key={ticket.id}
                                className='flex items-center gap-3 py-2 cursor-pointer'
                              >
                                <Checkbox
                                  checked={
                                    isListingSelected || isTicketSelected
                                  }
                                  disabled={isListingSelected}
                                  onCheckedChange={() =>
                                    onTicketToggle(ticket.listingTicketId)
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

      <div className='border-t bg-background px-6 py-4 shrink-0'>
        <div className='flex items-center justify-between mb-3'>
          <div>
            <p className='text-sm text-muted-foreground'>Total a retirar</p>
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
          onClick={onContinue}
          disabled={!hasSelection}
          className='w-full'
        >
          Continuar
          <ArrowRight className='h-4 w-4 ml-1.5' />
        </Button>
      </div>
    </>
  );
}
