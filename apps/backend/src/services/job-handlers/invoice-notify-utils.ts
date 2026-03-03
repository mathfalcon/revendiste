import type { InvoiceService } from '~/services/invoices';
import type { NotificationService } from '~/services/notifications/NotificationService';
import type { Invoices } from '@revendiste/shared';

export type SellerInvoiceBreakdown = {
  sellerSubtotal: string;
  sellerCommission: string;
  sellerVat: string;
  sellerAmount: string;
  currency: string;
};

/**
 * Issues an invoice for the given order/party, then calls the provided notify callback
 * with the issued invoice (and seller breakdown when party is seller).
 * For party 'seller', sellerUserId is required (one invoice per seller).
 * markEmailSent is NOT called here; the send-notification job does it after sending the email.
 */
export async function issueInvoiceAndNotifyOrderParty(
  invoiceService: InvoiceService,
  notificationService: NotificationService,
  orderId: string,
  party: 'buyer' | 'seller',
  notify: (
    notificationService: NotificationService,
    invoice: Invoices,
    sellerBreakdown?: SellerInvoiceBreakdown,
  ) => Promise<unknown>,
  sellerUserId?: string,
): Promise<void> {
  const result = await invoiceService.issueInvoice(
    orderId,
    party,
    party === 'seller' ? sellerUserId : undefined,
  );
  await notify(
    notificationService,
    result.invoice as Invoices,
    result.sellerBreakdown,
  );
}
