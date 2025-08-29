import {EventTicketCurrency} from '~/lib';

export const getCurrencySymbol = (currency: EventTicketCurrency) => {
  switch (currency) {
    case EventTicketCurrency.USD:
      return 'U$S';
    case EventTicketCurrency.UYU:
      return '$';
  }
};
