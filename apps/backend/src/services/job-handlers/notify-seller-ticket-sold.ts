import { logger } from '~/utils';
import type { JobHandler } from '~/services/job-queue';
import { notifyOrderInvoice } from '~/services/notifications/helpers';
import type { InvoiceService } from '~/services/invoices';
import type { NotificationService } from '~/services/notifications/NotificationService';
import { issueInvoiceAndNotifyOrderParty } from './invoice-notify-utils';

export interface NotifySellerTicketSoldPayload {
  orderId: string;
  sellerUserId: string;
  listingId: string;
  eventName: string;
  eventStartDate: string;
  eventEndDate: string;
  platform: string;
  qrAvailabilityTiming: string | null;
  ticketCount: number;
}

/**
 * Job handler for sending seller invoice email (deferred). Instant ticket-sold email is sent from the webhook.
 */
export function createNotifySellerTicketSoldHandler(
  invoiceService: InvoiceService,
  notificationService: NotificationService,
): JobHandler {
  return async (payload: Record<string, unknown>) => {
    const data = payload as unknown as NotifySellerTicketSoldPayload;

    await issueInvoiceAndNotifyOrderParty(
      invoiceService,
      notificationService,
      data.orderId,
      'seller',
      async (ns, invoice, sellerBreakdown) => {
        if (!invoice.pdfStoragePath) return;
        await notifyOrderInvoice(
          ns,
          {
            userId: data.sellerUserId,
            orderId: data.orderId,
            party: 'seller',
            eventName: data.eventName,
            currency: sellerBreakdown?.currency,
            sellerSubtotal: sellerBreakdown?.sellerSubtotal,
            sellerCommission: sellerBreakdown?.sellerCommission,
            sellerVat: sellerBreakdown?.sellerVat,
            sellerAmount: sellerBreakdown?.sellerAmount,
          },
          {
            attachmentRefs: [
              {
                type: 'storage',
                storagePath: invoice.pdfStoragePath,
                filename: `factura-${(invoice.providerResponse as { serie?: string; numero?: number })?.serie ?? 'invoice'}-${(invoice.providerResponse as { serie?: string; numero?: number })?.numero ?? invoice.id}.pdf`,
              },
            ],
            postSendActions: [
              { type: 'markInvoiceEmailSent', invoiceId: String(invoice.id) },
            ],
          },
        );
      },
      data.sellerUserId,
    );

    logger.info('Seller invoice notification enqueued (email sent via send-notification job)', {
      orderId: data.orderId,
      sellerUserId: data.sellerUserId,
    });
  };
}
