/**
 * WhatsApp Template Builder
 *
 * Maps notification types to WhatsApp Business API template names and parameters.
 * Templates must be pre-approved by Meta before use.
 *
 * Template naming convention: revendiste_{notification_type}
 * All templates use Spanish (es) language.
 */

import type {NotificationType, NotificationMetadata} from '@revendiste/shared';
import {type TypedNotificationMetadata} from '@revendiste/shared';
import type {WhatsAppTemplateComponent} from './providers/IWhatsAppProvider';

export interface WhatsAppTemplateData {
  templateName: string;
  templateLanguage: string;
  components?: WhatsAppTemplateComponent[];
}

/**
 * Build WhatsApp template data from notification type and metadata.
 * Returns null if the notification type doesn't have a WhatsApp template.
 */
export function buildWhatsAppTemplate(
  type: NotificationType,
  metadata: NotificationMetadata,
): WhatsAppTemplateData | null {
  switch (type) {
    case 'document_reminder': {
      const meta =
        metadata as TypedNotificationMetadata<'document_reminder'>;
      return {
        templateName: 'revendiste_document_reminder',
        templateLanguage: 'es',
        components: [
          {
            type: 'body',
            parameters: [
              {type: 'text', text: meta.eventName},
              {type: 'text', text: String(meta.hoursUntilEvent)},
              {type: 'text', text: String(meta.ticketCount)},
            ],
          },
        ],
      };
    }

    case 'ticket_sold_seller': {
      const meta =
        metadata as TypedNotificationMetadata<'ticket_sold_seller'>;
      return {
        templateName: 'revendiste_ticket_sold',
        templateLanguage: 'es',
        components: [
          {
            type: 'body',
            parameters: [
              {type: 'text', text: String(meta.ticketCount)},
              {type: 'text', text: meta.eventName},
            ],
          },
        ],
      };
    }

    case 'order_confirmed': {
      const meta =
        metadata as TypedNotificationMetadata<'order_confirmed'>;
      return {
        templateName: 'revendiste_order_confirmed',
        templateLanguage: 'es',
        components: [
          {
            type: 'body',
            parameters: [
              {type: 'text', text: meta.eventName},
              {type: 'text', text: `${meta.currency} ${meta.totalAmount}`},
            ],
          },
        ],
      };
    }

    case 'document_uploaded':
    case 'document_uploaded_batch': {
      const meta = metadata as TypedNotificationMetadata<'document_uploaded'>;
      return {
        templateName: 'revendiste_document_uploaded',
        templateLanguage: 'es',
        components: [
          {
            type: 'body',
            parameters: [{type: 'text', text: meta.eventName}],
          },
        ],
      };
    }

    case 'payout_completed': {
      const meta =
        metadata as TypedNotificationMetadata<'payout_completed'>;
      return {
        templateName: 'revendiste_payout_completed',
        templateLanguage: 'es',
        components: [
          {
            type: 'body',
            parameters: [
              {type: 'text', text: `${meta.currency} ${meta.amount}`},
            ],
          },
        ],
      };
    }

    default:
      // No WhatsApp template for this notification type
      return null;
  }
}
