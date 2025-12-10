/**
 * Email Template Mapping
 *
 * Maps notification types to their corresponding React Email templates.
 */

import {
  TicketSoldEmail as TicketSoldEmailComponent,
  type TicketSoldEmailProps,
} from '../emails/ticket-sold-email';
import {
  DocumentReminderEmail as DocumentReminderEmailComponent,
  type DocumentReminderEmailProps,
} from '../emails/document-reminder-email';
import {
  OrderConfirmedEmail as OrderConfirmedEmailComponent,
  type OrderConfirmedEmailProps,
} from '../emails/order-confirmed-email';
import {
  OrderExpiredEmail as OrderExpiredEmailComponent,
  type OrderExpiredEmailProps,
} from '../emails/order-expired-email';
import {
  PaymentFailedEmail as PaymentFailedEmailComponent,
  type PaymentFailedEmailProps,
} from '../emails/payment-failed-email';
import {
  PaymentSucceededEmail as PaymentSucceededEmailComponent,
  type PaymentSucceededEmailProps,
} from '../emails/payment-succeeded-email';
import {
  SellerTicketSoldEmail as SellerTicketSoldEmailComponent,
  type SellerTicketSoldEmailProps,
} from '../emails/seller-ticket-sold-email';
import type {
  NotificationType,
  TypedNotificationMetadata,
} from '@revendiste/shared';

export type {NotificationType};

import type {NotificationAction} from '@revendiste/shared';

export interface EmailTemplateProps<
  T extends NotificationType = NotificationType,
> {
  notificationType: T;
  actions?: NotificationAction[];
  metadata?: TypedNotificationMetadata<T>;
  appBaseUrl?: string;
}

/**
 * Get the appropriate email template component and props for a notification
 * Returns the component and props ready for rendering
 */
export function getEmailTemplate<T extends NotificationType>(
  props: EmailTemplateProps<T>,
): {
  Component: React.ComponentType<any>;
  props: Record<string, any>;
} {
  const {notificationType, metadata, actions, appBaseUrl} = props;

  const uploadUrl = actions?.find(a => a.type === 'upload_documents')?.url;
  const orderUrl = actions?.find(a => a.type === 'view_order')?.url;
  const retryUrl = actions?.find(a => a.type === 'retry_payment')?.url;

  switch (notificationType) {
    case 'ticket_sold_buyer': {
      const meta = metadata as TypedNotificationMetadata<'ticket_sold_buyer'>;
      return {
        Component: TicketSoldEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          ticketCount: meta?.ticketCount || 1,
          uploadUrl:
            uploadUrl ||
            `${appBaseUrl}/cuenta/publicaciones?subirTicket=${meta?.orderId}`,
          appBaseUrl,
        },
      };
    }

    case 'document_reminder': {
      const meta = metadata as TypedNotificationMetadata<'document_reminder'>;
      return {
        Component: DocumentReminderEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          eventStartDate: meta?.eventStartDate || new Date().toISOString(),
          ticketCount: meta?.ticketCount || 1,
          hoursUntilEvent: meta?.hoursUntilEvent || 24,
          uploadUrl:
            uploadUrl ||
            `${appBaseUrl}/cuenta/publicaciones?subirTicket=${meta?.listingId}`,
          appBaseUrl,
        },
      };
    }

    case 'order_confirmed': {
      const meta = metadata as TypedNotificationMetadata<'order_confirmed'>;
      return {
        Component: OrderConfirmedEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          totalAmount: meta?.totalAmount || '0.00',
          currency: meta?.currency || 'EUR',
          orderUrl:
            orderUrl || `${appBaseUrl}/cuenta/tickets?orderId=${meta?.orderId}`,
          appBaseUrl,
        },
      };
    }

    case 'order_expired': {
      const meta = metadata as TypedNotificationMetadata<'order_expired'>;
      return {
        Component: OrderExpiredEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          appBaseUrl,
        },
      };
    }

    case 'payment_failed': {
      const meta = metadata as TypedNotificationMetadata<'payment_failed'>;
      return {
        Component: PaymentFailedEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          errorMessage: meta?.errorMessage,
          retryUrl: retryUrl || `${appBaseUrl}/checkout/${meta?.orderId}`,
          appBaseUrl,
        },
      };
    }

    case 'payment_succeeded': {
      const meta = metadata as TypedNotificationMetadata<'payment_succeeded'>;
      return {
        Component: PaymentSucceededEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          totalAmount: meta?.totalAmount || '0.00',
          currency: meta?.currency || 'EUR',
          orderUrl:
            orderUrl || `${appBaseUrl}/cuenta/tickets?orderId=${meta?.orderId}`,
          appBaseUrl,
        },
      };
    }

    case 'ticket_sold_seller': {
      const meta = metadata as TypedNotificationMetadata<'ticket_sold_seller'>;
      return {
        Component: SellerTicketSoldEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          eventStartDate: meta?.eventStartDate || new Date().toISOString(),
          ticketCount: meta?.ticketCount || 1,
          uploadUrl: meta?.shouldPromptUpload
            ? uploadUrl ||
              `${appBaseUrl}/cuenta/publicaciones?subirTicket=${meta?.listingId}`
            : undefined,
          hoursUntilAvailable: undefined,
          appBaseUrl,
        },
      };
    }

    default:
      throw new Error(`Unknown notification type: ${notificationType}`);
  }
}
