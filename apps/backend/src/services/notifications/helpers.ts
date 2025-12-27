import {NotificationService, type CreateNotificationParams} from './index';
import {APP_BASE_URL} from '~/config/env';
import type {QrAvailabilityTiming} from '@revendiste/shared';

/**
 * Helper functions for creating common notification types
 * These functions provide a convenient API for creating notifications
 * with pre-configured titles, descriptions, and actions.
 */

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
    eventStartDate?: Date;
    eventEndDate?: Date;
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
  },
) {
  return await service.createNotification({
    userId: params.buyerUserId,
    type: 'order_confirmed',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'view_order',
        label: 'Ver mis tickets',
        url: `${APP_BASE_URL}/cuenta/tickets?orderId=${params.orderId}`,
      },
    ],
    metadata: {
      type: 'order_confirmed',
      orderId: params.orderId,
      eventName: params.eventName,
      eventStartDate: params.eventStartDate?.toISOString(),
      eventEndDate: params.eventEndDate?.toISOString(),
      venueName: params.venueName,
      venueAddress: params.venueAddress,
      totalAmount: params.totalAmount,
      subtotalAmount: params.subtotalAmount,
      platformCommission: params.platformCommission,
      vatOnCommission: params.vatOnCommission,
      currency: params.currency,
      items: params.items,
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
    actions: null, // Order expired notifications have no actions
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
 * Notify buyer when seller uploads ticket documents
 */
export async function notifyDocumentUploaded(
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
    type: 'document_uploaded',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'view_order',
        label: 'Ver y descargar entradas',
        url: `${APP_BASE_URL}/cuenta/tickets?orden=${params.orderId}`,
      },
    ],
    metadata: {
      type: 'document_uploaded',
      orderId: params.orderId,
      eventName: params.eventName,
      ticketCount: params.ticketCount,
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
      url: `${APP_BASE_URL}/cuenta/publicaciones?subirPublicacion=${params.listingId}`,
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

/**
 * Notify seller when payout is completed
 */
export async function notifyPayoutCompleted(
  service: NotificationService,
  params: {
    sellerUserId: string;
    payoutId: string;
    amount: string;
    currency: 'UYU' | 'USD';
    transactionReference?: string;
    completedAt: Date;
  },
) {
  return await service.createNotification({
    userId: params.sellerUserId,
    type: 'payout_completed',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'view_payout',
        label: 'Ver detalles del retiro',
        url: `${APP_BASE_URL}/cuenta/retiro?payoutId=${params.payoutId}`,
      },
    ],
    metadata: {
      type: 'payout_completed',
      payoutId: params.payoutId,
      amount: params.amount,
      currency: params.currency,
      transactionReference: params.transactionReference,
      completedAt: params.completedAt.toISOString(),
    },
  });
}

/**
 * Notify seller when payout fails
 */
export async function notifyPayoutFailed(
  service: NotificationService,
  params: {
    sellerUserId: string;
    payoutId: string;
    amount: string;
    currency: 'UYU' | 'USD';
    failureReason: string;
  },
) {
  return await service.createNotification({
    userId: params.sellerUserId,
    type: 'payout_failed',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'view_payout',
        label: 'Ver detalles del retiro',
        url: `${APP_BASE_URL}/cuenta/retiro?payoutId=${params.payoutId}`,
      },
    ],
    metadata: {
      type: 'payout_failed',
      payoutId: params.payoutId,
      amount: params.amount,
      currency: params.currency,
      failureReason: params.failureReason,
    },
  });
}

/**
 * Notify seller when payout is cancelled
 */
export async function notifyPayoutCancelled(
  service: NotificationService,
  params: {
    sellerUserId: string;
    payoutId: string;
    amount: string;
    currency: 'UYU' | 'USD';
    cancellationReason: string;
  },
) {
  return await service.createNotification({
    userId: params.sellerUserId,
    type: 'payout_cancelled',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'view_payout',
        label: 'Ver detalles del retiro',
        url: `${APP_BASE_URL}/cuenta/retiro?payoutId=${params.payoutId}`,
      },
    ],
    metadata: {
      type: 'payout_cancelled',
      payoutId: params.payoutId,
      amount: params.amount,
      currency: params.currency,
      cancellationReason: params.cancellationReason,
    },
  });
}
