import { logger } from '~/utils';
import type { JobHandler } from '~/services/job-queue';
import { notifyOrderInvoice } from '~/services/notifications/helpers';
import type { InvoiceService } from '~/services/invoices';
import type { NotificationService } from '~/services/notifications/NotificationService';
import { issueInvoiceAndNotifyOrderParty } from './invoice-notify-utils';

export interface NotifyOrderConfirmedPayload {
  orderId: string;
  buyerUserId: string;
  eventName: string;
  eventStartDate?: string;
  eventEndDate?: string;
  venueName?: string;
  venueAddress?: string;
  totalAmount: string;
  subtotalAmount: string;
  platformCommission: string;
  vatOnCommission: string;
  currency: string;
  items: Array<{
    id: string;
    ticketWaveName: string;
    quantity: number;
    pricePerTicket: string;
    subtotal: string;
    currency?: string;
  }>;
}

/**
 * Job handler for sending buyer invoice email (deferred). Instant order-confirmed email is sent from the webhook.
 */
export function createNotifyOrderConfirmedHandler(
  invoiceService: InvoiceService,
  notificationService: NotificationService,
): JobHandler {
  return async (payload: Record<string, unknown>) => {
    const data = payload as unknown as NotifyOrderConfirmedPayload;

    await issueInvoiceAndNotifyOrderParty(
      invoiceService,
      notificationService,
      data.orderId,
      'buyer',
      async (ns, invoice) => {
        if (!invoice.pdfStoragePath) return;
        await notifyOrderInvoice(
          ns,
          {
            userId: data.buyerUserId,
            orderId: data.orderId,
            party: 'buyer',
            eventName: data.eventName,
            currency: data.currency,
            subtotalAmount: data.subtotalAmount,
            platformCommission: data.platformCommission,
            vatOnCommission: data.vatOnCommission,
            totalAmount: data.totalAmount,
            items: data.items.map(item => ({
              ticketWaveName: item.ticketWaveName,
              quantity: item.quantity,
              pricePerTicket: item.pricePerTicket,
              subtotal: item.subtotal,
            })),
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
    );

    logger.info('Buyer invoice notification enqueued (email sent via send-notification job)', {
      orderId: data.orderId,
    });
  };
}
