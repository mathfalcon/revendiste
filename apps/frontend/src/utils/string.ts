import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {EventTicketCurrency} from '~/lib';

export const getCurrencySymbol = (currency: EventTicketCurrency) => {
  switch (currency) {
    case EventTicketCurrency.USD:
      return 'U$S';
    case EventTicketCurrency.UYU:
      return '$';
  }
};

export const formatEventDate = (date: Date) => {
  // "23 de septiembre a las 18:30"
  return format(date, "d 'de' MMMM 'a las' HH:mm", {locale: es});
};

export const formatPrice = (
  price: number,
  currency: EventTicketCurrency = EventTicketCurrency.UYU,
) => {
  return `${getCurrencySymbol(currency)} ${Math.round(price).toLocaleString('es-ES')}`;
};

// Re-export fee calculation functions for backward compatibility
export {calculateSellerAmount} from './fees';
