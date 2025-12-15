import {NotificationService, type CreateNotificationParams} from './index';
import {APP_BASE_URL} from '~/config/env';
import type {QrAvailabilityTiming} from '@revendiste/shared';

/**
 * Helper functions for creating common notification types
 * These functions provide a convenient API for creating notifications
 * with pre-configured titles, descriptions, and actions.
 */

/**
 * Notify buyer when their ticket is sold
 */
export async function notifyTicketSold(
  service: NotificationService,
  params: {
    buyerUserId: string;
    orderId: string;
    eventName: string;
    ticketCount: number;
  },
) {
  return await service.createNotification({
    userId: params.buyerUserId,
    type: 'ticket_sold_buyer',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'upload_documents',
        label: 'Subir documentos',
        url: `${APP_BASE_URL}/cuenta/publicaciones?subirTicket=${params.orderId}`,
      },
    ],
    metadata: {
      type: 'ticket_sold_buyer',
      orderId: params.orderId,
      eventName: params.eventName,
      ticketCount: params.ticketCount,
    },
  });
}

/**
 * Notify seller when event is close and documents haven't been uploaded
 */
export async function notifyDocumentReminder(
  service: NotificationService,
  params: {
    sellerUserId: string;
    listingId: string;
    eventName: string;
    eventStartDate: Date;
    ticketCount: number;
    hoursUntilEvent: number;
  },
) {
  return await service.createNotification({
    userId: params.sellerUserId,
    type: 'document_reminder',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'upload_documents',
        label: 'Subir documentos',
        url: `${APP_BASE_URL}/cuenta/publicaciones?subirTicket=${params.listingId}`,
      },
    ],
    metadata: {
      type: 'document_reminder',
      listingId: params.listingId,
      eventName: params.eventName,
      eventStartDate: params.eventStartDate.toISOString(),
      ticketCount: params.ticketCount,
      hoursUntilEvent: params.hoursUntilEvent,
    },
  });
}

/**
 * Notify buyer when order is confirmed
 */
export async function notifyOrderConfirmed(
  service: NotificationService,
  params: {
    buyerUserId: string;
    orderId: string;
    eventName: string;
    totalAmount: string;
    currency: string;
  },
) {
  return await service.createNotification({
    userId: params.buyerUserId,
    type: 'order_confirmed',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'view_order',
        label: 'Ver orden',
        url: `${APP_BASE_URL}/cuenta/tickets?orderId=${params.orderId}`,
      },
    ],
    metadata: {
      type: 'order_confirmed',
      orderId: params.orderId,
      eventName: params.eventName,
      totalAmount: params.totalAmount,
      currency: params.currency,
    },
  });
}

/**
 * Notify buyer when order expires
 */
export async function notifyOrderExpired(
  service: NotificationService,
  params: {
    buyerUserId: string;
    orderId: string;
    eventName: string;
  },
) {
  return await service.createNotification({
    userId: params.buyerUserId,
    type: 'order_expired',
    channels: ['in_app', 'email'],
    metadata: {
      type: 'order_expired',
      orderId: params.orderId,
      eventName: params.eventName,
    },
  });
}

/**
 * Notify buyer when payment fails
 */
export async function notifyPaymentFailed(
  service: NotificationService,
  params: {
    buyerUserId: string;
    orderId: string;
    eventName: string;
    errorMessage?: string;
  },
) {
  return await service.createNotification({
    userId: params.buyerUserId,
    type: 'payment_failed',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'retry_payment',
        label: 'Reintentar pago',
        url: `${APP_BASE_URL}/checkout/${params.orderId}`,
      },
    ],
    metadata: {
      type: 'payment_failed',
      orderId: params.orderId,
      eventName: params.eventName,
      errorMessage: params.errorMessage,
    },
  });
}

/**
 * Notify buyer when payment succeeds
 */
export async function notifyPaymentSucceeded(
  service: NotificationService,
  params: {
    buyerUserId: string;
    orderId: string;
    eventName: string;
    totalAmount: string;
    currency: string;
  },
) {
  return await service.createNotification({
    userId: params.buyerUserId,
    type: 'payment_succeeded',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'view_order',
        label: 'Ver orden',
        url: `${APP_BASE_URL}/cuenta/tickets?orderId=${params.orderId}`,
      },
    ],
    metadata: {
      type: 'payment_succeeded',
      orderId: params.orderId,
      eventName: params.eventName,
      totalAmount: params.totalAmount,
      currency: params.currency,
    },
  });
}

/**
 * Check if upload should be prompted based on platform timing restrictions
 * Returns true if upload should be prompted, false otherwise
 */
function shouldPromptUpload(
  qrAvailabilityTiming: QrAvailabilityTiming | null,
  eventStartDate: Date,
  eventEndDate: Date,
): boolean {
  const now = new Date();

  // Can't upload after event has ended
  if (now > eventEndDate) {
    return false;
  }

  // If no timing restriction, allow upload anytime before event ends
  if (!qrAvailabilityTiming) {
    return true;
  }

  // Parse hours from timing (e.g., "12h" -> 12)
  const hoursBeforeEvent = parseInt(qrAvailabilityTiming.replace('h', ''), 10);
  const uploadAvailableAt = new Date(eventStartDate);
  uploadAvailableAt.setHours(uploadAvailableAt.getHours() - hoursBeforeEvent);

  // Only prompt if we're within the upload window (between uploadAvailableAt and eventStartDate)
  return now >= uploadAvailableAt && now < eventStartDate;
}

/**
 * Notify seller when their tickets are sold
 * Only prompts upload if within platform's allowed time window
 */
export async function notifySellerTicketSold(
  service: NotificationService,
  params: {
    sellerUserId: string;
    listingId: string;
    eventName: string;
    eventStartDate: Date;
    eventEndDate: Date;
    platform: string;
    qrAvailabilityTiming: QrAvailabilityTiming | null;
    ticketCount: number;
  },
) {
  const shouldPrompt = shouldPromptUpload(
    params.qrAvailabilityTiming,
    params.eventStartDate,
    params.eventEndDate,
  );

  const actions: Array<{
    type: 'upload_documents' | 'view_order' | 'retry_payment';
    label: string;
    url?: string;
  }> = [];

  // Only add upload action if within allowed time window
  if (shouldPrompt) {
    actions.push({
      type: 'upload_documents',
      label: 'Subir documentos',
      url: `${APP_BASE_URL}/cuenta/publicaciones?subirTicket=${params.listingId}`,
    });
  }

  return await service.createNotification({
    userId: params.sellerUserId,
    type: 'ticket_sold_seller',
    channels: ['in_app', 'email'],
    actions: actions.length > 0 ? actions : undefined,
    metadata: {
      type: 'ticket_sold_seller',
      listingId: params.listingId,
      eventName: params.eventName,
      eventStartDate: params.eventStartDate.toISOString(),
      ticketCount: params.ticketCount,
      platform: params.platform,
      qrAvailabilityTiming: params.qrAvailabilityTiming,
      shouldPromptUpload: shouldPrompt,
    },
  });
}
