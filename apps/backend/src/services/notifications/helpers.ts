import { NotificationService, type CreateNotificationParams } from './index';
import { APP_BASE_URL } from '~/config/env';
import type { QrAvailabilityTiming } from '@revendiste/shared';

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
        url: `${APP_BASE_URL}/cuenta/publicaciones?subirPublicacion=${params.listingId}`,
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
 *
 * Uses debouncing to batch multiple uploads for the same order into a single notification.
 * If multiple tickets are uploaded within 5 minutes, only one email is sent.
 *
 * IMPORTANT: Requires NotificationBatchesRepository to be configured in the NotificationService
 * for debouncing to work. If not configured, falls back to immediate notifications.
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
  // Default debounce window: 5 minutes
  // This allows multiple uploads for the same order to be batched into one notification
  const DEBOUNCE_WINDOW_MS = 5 * 60 * 1000;

  return await service.createDebouncedNotification({
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
    debounce: {
      key: `document_uploaded:${params.orderId}`,
      windowMs: DEBOUNCE_WINDOW_MS,
    },
  });
}

/**
 * Notify buyer when seller uploads ticket documents (immediate, non-debounced)
 *
 * Use this for testing or when you explicitly want immediate notifications.
 * For production, prefer notifyDocumentUploaded() which uses debouncing.
 */
export async function notifyDocumentUploadedImmediate(
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

// ============================================================================
// Identity Verification Notifications
// ============================================================================

/**
 * Notify user when identity verification is completed successfully
 * Sent via email + in_app (high value - user can now sell)
 */
export async function notifyIdentityVerificationCompleted(
  service: NotificationService,
  params: {
    userId: string;
  },
) {
  return await service.createNotification({
    userId: params.userId,
    type: 'identity_verification_completed',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'publish_tickets',
        label: 'Publicar entradas',
        url: `${APP_BASE_URL}/entradas/publicar`,
      },
    ],
    metadata: {
      type: 'identity_verification_completed',
    },
  });
}

/**
 * Notify user when identity verification is rejected by an admin
 * Sent via email + in_app (high value - user needs to retry)
 */
export async function notifyIdentityVerificationRejected(
  service: NotificationService,
  params: {
    userId: string;
    rejectionReason: string;
    canRetry: boolean;
  },
) {
  const actions: Array<{
    type: 'start_verification';
    label: string;
    url: string;
  }> = [];

  if (params.canRetry) {
    actions.push({
      type: 'start_verification',
      label: 'Reintentar verificación',
      url: `${APP_BASE_URL}/cuenta/verificar`,
    });
  }

  return await service.createNotification({
    userId: params.userId,
    type: 'identity_verification_rejected',
    channels: ['in_app', 'email'],
    actions: actions.length > 0 ? actions : null,
    metadata: {
      type: 'identity_verification_rejected',
      rejectionReason: params.rejectionReason,
      canRetry: params.canRetry,
    },
  });
}

/**
 * Notify user when identity verification fails due to system issues
 * (face mismatch, liveness failure, etc.)
 * Sent via in_app only (user can retry immediately in UI)
 */
export async function notifyIdentityVerificationFailed(
  service: NotificationService,
  params: {
    userId: string;
    failureReason: string;
    attemptsRemaining: number;
  },
) {
  const actions: Array<{
    type: 'start_verification';
    label: string;
    url: string;
  }> = [];

  if (params.attemptsRemaining > 0) {
    actions.push({
      type: 'start_verification',
      label: 'Reintentar verificación',
      url: `${APP_BASE_URL}/cuenta/verificar`,
    });
  }

  return await service.createNotification({
    userId: params.userId,
    type: 'identity_verification_failed',
    channels: ['in_app'], // in_app only - no email cost
    actions: actions.length > 0 ? actions : null,
    metadata: {
      type: 'identity_verification_failed',
      failureReason: params.failureReason,
      attemptsRemaining: params.attemptsRemaining,
    },
  });
}

/**
 * Notify user when identity verification requires manual review
 * Sent via in_app only (just informational, no action required from user)
 */
export async function notifyIdentityVerificationManualReview(
  service: NotificationService,
  params: {
    userId: string;
  },
) {
  return await service.createNotification({
    userId: params.userId,
    type: 'identity_verification_manual_review',
    channels: ['in_app'], // in_app only - no email cost
    actions: null,
    metadata: {
      type: 'identity_verification_manual_review',
    },
  });
}

// ============================================================================
// Missing Document Refund System Notifications
// ============================================================================

/**
 * Notify seller when their earnings are retained due to missing documents
 * Sent via email + in_app (high value - seller needs to know)
 */
export async function notifySellerEarningsRetained(
  service: NotificationService,
  params: {
    sellerUserId: string;
    eventName: string;
    ticketCount: number;
    reason: 'missing_document' | 'dispute' | 'fraud' | 'other';
    totalAmount?: string;
    currency?: 'UYU' | 'USD';
  },
) {
  return await service.createNotification({
    userId: params.sellerUserId,
    type: 'seller_earnings_retained',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'view_earnings',
        label: 'Ver ganancias',
        url: `${APP_BASE_URL}/cuenta/ganancias`,
      },
    ],
    metadata: {
      type: 'seller_earnings_retained',
      eventName: params.eventName,
      ticketCount: params.ticketCount,
      reason: params.reason,
      totalAmount: params.totalAmount,
      currency: params.currency,
    },
  });
}

/**
 * Notify buyer when their tickets are cancelled due to seller failure
 * Sent via email + in_app (high value - buyer needs to know about refund)
 */
export async function notifyBuyerTicketCancelled(
  service: NotificationService,
  params: {
    buyerUserId: string;
    eventName: string;
    ticketCount: number;
    reason: 'seller_failed_to_upload' | 'seller_fraud' | 'other';
  },
) {
  return await service.createNotification({
    userId: params.buyerUserId,
    type: 'buyer_ticket_cancelled',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'view_order',
        label: 'Ver mis tickets',
        url: `${APP_BASE_URL}/cuenta/tickets`,
      },
    ],
    metadata: {
      type: 'buyer_ticket_cancelled',
      eventName: params.eventName,
      ticketCount: params.ticketCount,
      reason: params.reason,
    },
  });
}
