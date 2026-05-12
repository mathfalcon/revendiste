import {useMemo, useState, useCallback, useEffect} from 'react';
import type {EventTicketCurrency} from '@revendiste/shared';
import type {WithdrawalListingGroup} from './types';

type AvailableEarnings = {
  byListing: Array<{
    listingId: string;
    eventName: string;
    eventStartDate: string;
    ticketCount: number;
    totalAmount: string;
    currency: EventTicketCurrency;
  }>;
  byTicket: Array<{
    id: string;
    listingId: string;
    listingTicketId: string;
    sellerAmount: string;
    currency: EventTicketCurrency;
  }>;
};

export function useWithdrawalEarningsSelection(
  currency: EventTicketCurrency,
  availableEarnings: AvailableEarnings | undefined,
) {
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedListingIds([]);
    setSelectedTicketIds([]);
  }, [currency]);

  const resetSelection = useCallback(() => {
    setSelectedListingIds([]);
    setSelectedTicketIds([]);
  }, []);

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

  const listingGroups: WithdrawalListingGroup[] = useMemo(
    () =>
      filteredByListing.map(listing => ({
        ...listing,
        tickets: filteredByTicket.filter(t => t.listingId === listing.listingId),
      })),
    [filteredByListing, filteredByTicket],
  );

  const selectedTotal = useMemo(() => {
    let total = 0;
    selectedListingIds.forEach(id => {
      const listing = filteredByListing.find(l => l.listingId === id);
      if (listing) total += parseFloat(listing.totalAmount);
    });
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

  const allSelected =
    filteredByListing.length > 0 &&
    filteredByListing.every(l => selectedListingIds.includes(l.listingId));

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedListingIds([]);
      setSelectedTicketIds([]);
    } else {
      setSelectedListingIds(filteredByListing.map(l => l.listingId));
      setSelectedTicketIds([]);
    }
  }, [allSelected, filteredByListing]);

  const handleListingToggle = useCallback(
    (listingId: string) => {
      setSelectedListingIds(prev => {
        if (prev.includes(listingId)) {
          return prev.filter(id => id !== listingId);
        }
        const ticketsInListing = filteredByTicket
          .filter(t => t.listingId === listingId)
          .map(t => t.listingTicketId);
        setSelectedTicketIds(current =>
          current.filter(id => !ticketsInListing.includes(id)),
        );
        return [...prev, listingId];
      });
    },
    [filteredByTicket],
  );

  const handleTicketToggle = useCallback(
    (ticketId: string) => {
      setSelectedTicketIds(prev => {
        if (prev.includes(ticketId)) {
          return prev.filter(id => id !== ticketId);
        }
        const ticket = filteredByTicket.find(t => t.listingTicketId === ticketId);
        if (ticket && selectedListingIds.includes(ticket.listingId)) {
          setSelectedListingIds(current =>
            current.filter(id => id !== ticket.listingId),
          );
        }
        return [...prev, ticketId];
      });
    },
    [filteredByTicket, selectedListingIds],
  );

  const hasSelection =
    selectedListingIds.length > 0 || selectedTicketIds.length > 0;

  const hasCurrencies = {
    UYU: availableEarnings?.byListing.some(l => l.currency === 'UYU') ?? false,
    USD: availableEarnings?.byListing.some(l => l.currency === 'USD') ?? false,
  };

  return {
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
  };
}
