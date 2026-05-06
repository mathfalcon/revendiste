import type {EventTicketCurrency} from '@revendiste/shared';

export interface WithdrawalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCurrency: EventTicketCurrency;
}

export interface WithdrawalListingGroup {
  listingId: string;
  eventName: string;
  eventStartDate: string;
  ticketCount: number;
  totalAmount: string;
  currency: EventTicketCurrency;
  tickets: Array<{
    id: string;
    listingTicketId: string;
    sellerAmount: string;
  }>;
}
