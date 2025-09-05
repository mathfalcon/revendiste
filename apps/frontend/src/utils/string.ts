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
  return `${getCurrencySymbol(currency)} ${price.toLocaleString('es-ES')}`;
};

export const calculateSellerAmount = (
  sellingPrice: number,
  currency: EventTicketCurrency = EventTicketCurrency.UYU,
) => {
  const PLATFORM_COMMISSION_RATE = 0.06; // 6%
  const VAT_RATE = 0.22; // 22% IVA in Uruguay

  // Calculate platform commission
  const platformCommission = sellingPrice * PLATFORM_COMMISSION_RATE;

  // Calculate VAT on the platform commission (not on the entire price)
  const vatOnCommission = platformCommission * VAT_RATE;

  // Calculate total deductions
  const totalDeductions = platformCommission + vatOnCommission;

  // Calculate what the seller receives
  const sellerAmount = sellingPrice - totalDeductions;

  return {
    sellingPrice,
    platformCommission,
    vatOnCommission,
    totalDeductions,
    sellerAmount,
    currency,
  };
};
