/**
 * Shared notification schemas
 *
 * These Zod schemas define the structure of notifications, metadata, and actions.
 * They are used by both backend and transactional packages for type safety.
 */

import {z} from 'zod';
import type {QrAvailabilityTiming, NotificationType} from '../types';
import type {
  PostSendAction,
  SendNotificationAttachmentRef,
} from './jobs';

/**
 * Base notification schema with shared properties
 */
export const BaseNotificationSchema = z.object({
  id: z.uuid().optional(),
  userId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  channels: z.array(z.enum(['in_app', 'email', 'sms'] as const)),
  status: z.enum(['pending', 'sent', 'failed', 'seen'] as const),
  seenAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const NotificationActionType = z.enum([
  'upload_documents',
  'view_order',
  'retry_payment',
  'view_payout',
  'start_verification',
  'publish_tickets',
  'view_earnings',
]);

export type NotificationActionType = z.infer<typeof NotificationActionType>;

export const BaseActionSchema = z.object({
  type: NotificationActionType,
  label: z.string(),
  url: z.url().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type NotificationAction = z.infer<typeof BaseActionSchema>;

/**
 * Individual metadata schemas for each notification type
 */

// ticket_sold_seller
export const TicketSoldSellerMetadataSchema = z.object({
  type: z.literal('ticket_sold_seller'),
  listingId: z.uuid(),
  eventName: z.string(),
  eventStartDate: z.string(), // ISO string
  ticketCount: z.number().int().positive(),
  platform: z.string(),
  qrAvailabilityTiming: z.custom<QrAvailabilityTiming>().nullable().optional(),
  shouldPromptUpload: z.boolean(),
});

export const DocumentReminderMetadataSchema = z.object({
  type: z.literal('document_reminder'),
  listingId: z.uuid(),
  eventName: z.string(),
  eventStartDate: z.string(), // ISO string
  ticketCount: z.number().int().positive(),
  hoursUntilEvent: z.number().int().nonnegative(), // 0 means event already started
});

export const OrderConfirmedMetadataSchema = z.object({
  type: z.literal('order_confirmed'),
  orderId: z.uuid(),
  eventName: z.string(),
  eventStartDate: z.string().optional(), // ISO string
  eventEndDate: z.string().optional(), // ISO string
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  totalAmount: z.string(),
  subtotalAmount: z.string(),
  platformCommission: z.string(),
  vatOnCommission: z.string(),
  currency: z.string(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      ticketWaveName: z.string(),
      quantity: z.number().int().positive(),
      pricePerTicket: z.string(),
      subtotal: z.string(),
      currency: z.string().optional(),
    }),
  ),
});

export const OrderExpiredMetadataSchema = z.object({
  type: z.literal('order_expired'),
  orderId: z.uuid(),
  eventName: z.string(),
});

export const PaymentFailedMetadataSchema = z.object({
  type: z.literal('payment_failed'),
  orderId: z.uuid(),
  eventName: z.string(),
  errorMessage: z.string().optional(),
});

export const PaymentSucceededMetadataSchema = z.object({
  type: z.literal('payment_succeeded'),
  orderId: z.uuid(),
  eventName: z.string(),
  totalAmount: z.string(),
  currency: z.string(),
});

export const DocumentUploadedMetadataSchema = z.object({
  type: z.literal('document_uploaded'),
  orderId: z.uuid(),
  eventName: z.string(),
  ticketCount: z.number().int().positive(),
});

// document_uploaded_batch - Batched/consolidated document upload notification
export const DocumentUploadedBatchMetadataSchema = z.object({
  type: z.literal('document_uploaded_batch'),
  orderId: z.uuid(),
  eventName: z.string(),
  uploadedCount: z.number().int().positive(), // Number of tickets uploaded in this batch
  tickets: z.array(
    z.object({
      ticketNumber: z.string(),
      eventName: z.string(),
    }),
  ),
});

// payout_processing
export const PayoutProcessingMetadataSchema = z.object({
  type: z.literal('payout_processing'),
  payoutId: z.string().uuid(),
  amount: z.string(),
  currency: z.enum(['UYU', 'USD']),
  processingFee: z.number().optional(),
  transactionReference: z.string().optional(),
});

// payout_completed
export const PayoutCompletedMetadataSchema = z.object({
  type: z.literal('payout_completed'),
  payoutId: z.string().uuid(),
  amount: z.string(),
  currency: z.enum(['UYU', 'USD']),
  transactionReference: z.string().optional(),
  completedAt: z.string(),
});

// payout_failed
export const PayoutFailedMetadataSchema = z.object({
  type: z.literal('payout_failed'),
  payoutId: z.string().uuid(),
  amount: z.string(),
  currency: z.enum(['UYU', 'USD']),
  failureReason: z.string(),
});

// payout_cancelled
export const PayoutCancelledMetadataSchema = z.object({
  type: z.literal('payout_cancelled'),
  payoutId: z.string().uuid(),
  amount: z.string(),
  currency: z.enum(['UYU', 'USD']),
  cancellationReason: z.string(),
});

/**
 * Auth notification metadata schemas (Clerk webhook triggered)
 */

// auth_verification_code - OTP for email verification
export const AuthVerificationCodeMetadataSchema = z.object({
  type: z.literal('auth_verification_code'),
  otpCode: z.string(),
  requestedFrom: z.string().optional(),
  requestedAt: z.string().optional(),
});

// auth_reset_password_code - OTP for password reset
export const AuthResetPasswordCodeMetadataSchema = z.object({
  type: z.literal('auth_reset_password_code'),
  otpCode: z.string(),
  requestedFrom: z.string().optional(),
  requestedAt: z.string().optional(),
});

// auth_invitation - User invitation
export const AuthInvitationMetadataSchema = z.object({
  type: z.literal('auth_invitation'),
  inviterName: z.string().optional(),
  expiresInDays: z.number(),
  actionUrl: z.string(),
});

// auth_password_changed - Password changed notification
export const AuthPasswordChangedMetadataSchema = z.object({
  type: z.literal('auth_password_changed'),
  greetingName: z.string().optional(),
  primaryEmailAddress: z.string(),
});

// auth_password_removed - Password removed notification
export const AuthPasswordRemovedMetadataSchema = z.object({
  type: z.literal('auth_password_removed'),
  greetingName: z.string().optional(),
  primaryEmailAddress: z.string(),
});

// auth_primary_email_changed - Primary email changed notification
export const AuthPrimaryEmailChangedMetadataSchema = z.object({
  type: z.literal('auth_primary_email_changed'),
  newEmailAddress: z.string(),
});

// auth_new_device_sign_in - New device sign-in alert
export const AuthNewDeviceSignInMetadataSchema = z.object({
  type: z.literal('auth_new_device_sign_in'),
  signInMethod: z.string().optional(),
  deviceType: z.string().optional(),
  browserName: z.string().optional(),
  operatingSystem: z.string().optional(),
  location: z.string().optional(),
  ipAddress: z.string().optional(),
  sessionCreatedAt: z.string(),
  revokeSessionUrl: z.string().optional(),
  supportEmail: z.string().optional(),
});

/**
 * Identity verification notification metadata schemas
 */

// identity_verification_completed - User verified successfully (auto or admin approved)
export const IdentityVerificationCompletedMetadataSchema = z.object({
  type: z.literal('identity_verification_completed'),
});

// identity_verification_rejected - Admin rejected verification
export const IdentityVerificationRejectedMetadataSchema = z.object({
  type: z.literal('identity_verification_rejected'),
  rejectionReason: z.string(),
  canRetry: z.boolean(),
});

// identity_verification_failed - System failure (face mismatch, liveness fail)
export const IdentityVerificationFailedMetadataSchema = z.object({
  type: z.literal('identity_verification_failed'),
  failureReason: z.string(),
  attemptsRemaining: z.number().int().nonnegative(),
});

// identity_verification_manual_review - Borderline scores, needs admin review
export const IdentityVerificationManualReviewMetadataSchema = z.object({
  type: z.literal('identity_verification_manual_review'),
});

/**
 * Missing document refund system notification metadata schemas
 */

// seller_earnings_retained - Seller earnings retained due to missing document
export const SellerEarningsRetainedMetadataSchema = z.object({
  type: z.literal('seller_earnings_retained'),
  eventName: z.string(),
  ticketCount: z.number().int().positive(),
  reason: z.enum(['missing_document', 'dispute', 'fraud', 'other']),
  totalAmount: z.string().optional(),
  currency: z.enum(['UYU', 'USD']).optional(),
});

// buyer_ticket_cancelled - Buyer's ticket cancelled due to seller failure
export const BuyerTicketCancelledMetadataSchema = z.object({
  type: z.literal('buyer_ticket_cancelled'),
  eventName: z.string(),
  ticketCount: z.number().int().positive(),
  reason: z.enum(['seller_failed_to_upload', 'seller_fraud', 'other']),
});

// order_invoice - Deferred email with invoice PDF only (buyer or seller)
export const OrderInvoiceItemSchema = z.object({
  ticketWaveName: z.string(),
  quantity: z.number().int().positive(),
  pricePerTicket: z.string(),
  subtotal: z.string(),
});

export const OrderInvoiceMetadataSchema = z.object({
  type: z.literal('order_invoice'),
  orderId: z.string().uuid(),
  party: z.enum(['buyer', 'seller']),
  eventName: z.string().optional(),
  currency: z.string().optional(),
  // Buyer breakdown (when party=buyer)
  subtotalAmount: z.string().optional(),
  platformCommission: z.string().optional(),
  vatOnCommission: z.string().optional(),
  totalAmount: z.string().optional(),
  items: z.array(OrderInvoiceItemSchema).optional(),
  // Seller breakdown (when party=seller)
  sellerSubtotal: z.string().optional(),
  sellerCommission: z.string().optional(),
  sellerVat: z.string().optional(),
  sellerAmount: z.string().optional(),
});

/**
 * Discriminated union of all notification metadata types
 * Uses 'type' as the discriminator field for type safety
 */
export const NotificationMetadataSchema = z.discriminatedUnion('type', [
  TicketSoldSellerMetadataSchema,
  DocumentReminderMetadataSchema,
  OrderConfirmedMetadataSchema,
  OrderExpiredMetadataSchema,
  PaymentFailedMetadataSchema,
  PaymentSucceededMetadataSchema,
  DocumentUploadedMetadataSchema,
  DocumentUploadedBatchMetadataSchema,
  PayoutProcessingMetadataSchema,
  PayoutCompletedMetadataSchema,
  PayoutFailedMetadataSchema,
  PayoutCancelledMetadataSchema,
  // Auth notification types
  AuthVerificationCodeMetadataSchema,
  AuthResetPasswordCodeMetadataSchema,
  AuthInvitationMetadataSchema,
  AuthPasswordChangedMetadataSchema,
  AuthPasswordRemovedMetadataSchema,
  AuthPrimaryEmailChangedMetadataSchema,
  AuthNewDeviceSignInMetadataSchema,
  // Identity verification notification types
  IdentityVerificationCompletedMetadataSchema,
  IdentityVerificationRejectedMetadataSchema,
  IdentityVerificationFailedMetadataSchema,
  IdentityVerificationManualReviewMetadataSchema,
  // Missing document refund notification types
  SellerEarningsRetainedMetadataSchema,
  BuyerTicketCancelledMetadataSchema,
  OrderInvoiceMetadataSchema,
]);

/**
 * TypeScript type inferred from the discriminated union schema
 */
export type NotificationMetadata = z.infer<typeof NotificationMetadataSchema>;

/**
 * Metadata as stored in DB / used internally; may include attachmentRefs and postSendActions for send-notification job.
 * Do not expose attachmentRefs or postSendActions in API responses.
 */
export type NotificationMetadataStored = NotificationMetadata & {
  attachmentRefs?: SendNotificationAttachmentRef[];
  postSendActions?: PostSendAction[];
};

/**
 * Typed metadata based on notification type
 * Extracts the specific metadata type from the discriminated union
 */
export type TypedNotificationMetadata<T extends NotificationType> = Extract<
  NotificationMetadata,
  {type: T}
>;

/**
 * Action schemas for each notification type
 * Some notification types may have specific action requirements
 */

// Actions for ticket_sold (seller) - upload documents action (optional)
export const TicketSoldSellerActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('upload_documents'),
      label: z.string(),
      url: z.url().optional(),
    }),
  )
  .nullable();

// Actions for document_reminder - upload documents action
export const DocumentReminderActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('upload_documents'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

// Actions for order_confirmed - view order action
export const OrderConfirmedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_order'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

// Actions for order_invoice - optional view order action
export const OrderInvoiceActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_order'),
      label: z.string(),
      url: z.url().optional(),
    }),
  )
  .nullable();

// Actions for order_expired - no actions
export const OrderExpiredActionsSchema = z.array(BaseActionSchema).nullable();

// Actions for payment_failed - retry payment action
export const PaymentFailedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('retry_payment'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

// Actions for payment_succeeded - view order action
export const PaymentSucceededActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_order'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

// Actions for document_uploaded - view order action
export const DocumentUploadedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_order'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

// Actions for document_uploaded_batch - view order action
export const DocumentUploadedBatchActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_order'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

// Actions for payout notifications - view payout action
export const PayoutProcessingActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_payout'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

export const PayoutCompletedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_payout'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

export const PayoutFailedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_payout'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

export const PayoutCancelledActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_payout'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

/**
 * Auth notification action schemas
 * Auth emails are transactional and don't typically have actions stored
 */
export const AuthVerificationCodeActionsSchema = z
  .array(BaseActionSchema)
  .nullable();
export const AuthResetPasswordCodeActionsSchema = z
  .array(BaseActionSchema)
  .nullable();
export const AuthInvitationActionsSchema = z.array(BaseActionSchema).nullable();
export const AuthPasswordChangedActionsSchema = z
  .array(BaseActionSchema)
  .nullable();
export const AuthPasswordRemovedActionsSchema = z
  .array(BaseActionSchema)
  .nullable();
export const AuthPrimaryEmailChangedActionsSchema = z
  .array(BaseActionSchema)
  .nullable();
export const AuthNewDeviceSignInActionsSchema = z
  .array(BaseActionSchema)
  .nullable();

/**
 * Identity verification notification action schemas
 */
// Completed - action to publish tickets
export const IdentityVerificationCompletedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('publish_tickets'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

// Rejected - action to retry verification
export const IdentityVerificationRejectedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('start_verification'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

// Failed - action to retry verification
export const IdentityVerificationFailedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('start_verification'),
      label: z.string(),
      url: z.url(),
    }),
  )
  .nullable();

// Manual review - no actions (just informational)
export const IdentityVerificationManualReviewActionsSchema = z
  .array(BaseActionSchema)
  .nullable();

/**
 * Missing document refund notification action schemas
 */

// seller_earnings_retained - view earnings action
export const SellerEarningsRetainedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_earnings'),
      label: z.string(),
      url: z.url().optional(),
    }),
  )
  .nullable();

// buyer_ticket_cancelled - view order action
export const BuyerTicketCancelledActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_order'),
      label: z.string(),
      url: z.url().optional(),
    }),
  )
  .nullable();

/**
 * Individual notification schemas per type
 * Each extends the base schema and defines its own metadata and actions
 */

// ticket_sold_seller
export const TicketSoldSellerNotificationSchema = BaseNotificationSchema.extend(
  {
    type: z.literal('ticket_sold_seller'),
    metadata: TicketSoldSellerMetadataSchema,
    actions: TicketSoldSellerActionsSchema,
  },
);

// document_reminder
export const DocumentReminderNotificationSchema = BaseNotificationSchema.extend(
  {
    type: z.literal('document_reminder'),
    metadata: DocumentReminderMetadataSchema,
    actions: DocumentReminderActionsSchema,
  },
);

// order_confirmed
export const OrderConfirmedNotificationSchema = BaseNotificationSchema.extend({
  type: z.literal('order_confirmed'),
  metadata: OrderConfirmedMetadataSchema,
  actions: OrderConfirmedActionsSchema,
});

// order_expired
export const OrderExpiredNotificationSchema = BaseNotificationSchema.extend({
  type: z.literal('order_expired'),
  metadata: OrderExpiredMetadataSchema,
  actions: OrderExpiredActionsSchema,
});

// payment_failed
export const PaymentFailedNotificationSchema = BaseNotificationSchema.extend({
  type: z.literal('payment_failed'),
  metadata: PaymentFailedMetadataSchema,
  actions: PaymentFailedActionsSchema,
});

// payment_succeeded
export const PaymentSucceededNotificationSchema = BaseNotificationSchema.extend(
  {
    type: z.literal('payment_succeeded'),
    metadata: PaymentSucceededMetadataSchema,
    actions: PaymentSucceededActionsSchema,
  },
);

// document_uploaded
export const DocumentUploadedNotificationSchema = BaseNotificationSchema.extend(
  {
    type: z.literal('document_uploaded'),
    metadata: DocumentUploadedMetadataSchema,
    actions: DocumentUploadedActionsSchema,
  },
);

// document_uploaded_batch
export const DocumentUploadedBatchNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('document_uploaded_batch'),
    metadata: DocumentUploadedBatchMetadataSchema,
    actions: DocumentUploadedBatchActionsSchema,
  });

// payout_processing
export const PayoutProcessingNotificationSchema = BaseNotificationSchema.extend(
  {
    type: z.literal('payout_processing'),
    metadata: PayoutProcessingMetadataSchema,
    actions: PayoutProcessingActionsSchema,
  },
);

// payout_completed
export const PayoutCompletedNotificationSchema = BaseNotificationSchema.extend({
  type: z.literal('payout_completed'),
  metadata: PayoutCompletedMetadataSchema,
  actions: PayoutCompletedActionsSchema,
});

// payout_failed
export const PayoutFailedNotificationSchema = BaseNotificationSchema.extend({
  type: z.literal('payout_failed'),
  metadata: PayoutFailedMetadataSchema,
  actions: PayoutFailedActionsSchema,
});

// payout_cancelled
export const PayoutCancelledNotificationSchema = BaseNotificationSchema.extend({
  type: z.literal('payout_cancelled'),
  metadata: PayoutCancelledMetadataSchema,
  actions: PayoutCancelledActionsSchema,
});

/**
 * Auth notification schemas
 */

// auth_verification_code
export const AuthVerificationCodeNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('auth_verification_code'),
    metadata: AuthVerificationCodeMetadataSchema,
    actions: AuthVerificationCodeActionsSchema,
  });

// auth_reset_password_code
export const AuthResetPasswordCodeNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('auth_reset_password_code'),
    metadata: AuthResetPasswordCodeMetadataSchema,
    actions: AuthResetPasswordCodeActionsSchema,
  });

// auth_invitation
export const AuthInvitationNotificationSchema = BaseNotificationSchema.extend({
  type: z.literal('auth_invitation'),
  metadata: AuthInvitationMetadataSchema,
  actions: AuthInvitationActionsSchema,
});

// auth_password_changed
export const AuthPasswordChangedNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('auth_password_changed'),
    metadata: AuthPasswordChangedMetadataSchema,
    actions: AuthPasswordChangedActionsSchema,
  });

// auth_password_removed
export const AuthPasswordRemovedNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('auth_password_removed'),
    metadata: AuthPasswordRemovedMetadataSchema,
    actions: AuthPasswordRemovedActionsSchema,
  });

// auth_primary_email_changed
export const AuthPrimaryEmailChangedNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('auth_primary_email_changed'),
    metadata: AuthPrimaryEmailChangedMetadataSchema,
    actions: AuthPrimaryEmailChangedActionsSchema,
  });

// auth_new_device_sign_in
export const AuthNewDeviceSignInNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('auth_new_device_sign_in'),
    metadata: AuthNewDeviceSignInMetadataSchema,
    actions: AuthNewDeviceSignInActionsSchema,
  });

/**
 * Identity verification notification schemas
 */

// identity_verification_completed
export const IdentityVerificationCompletedNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('identity_verification_completed'),
    metadata: IdentityVerificationCompletedMetadataSchema,
    actions: IdentityVerificationCompletedActionsSchema,
  });

// identity_verification_rejected
export const IdentityVerificationRejectedNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('identity_verification_rejected'),
    metadata: IdentityVerificationRejectedMetadataSchema,
    actions: IdentityVerificationRejectedActionsSchema,
  });

// identity_verification_failed
export const IdentityVerificationFailedNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('identity_verification_failed'),
    metadata: IdentityVerificationFailedMetadataSchema,
    actions: IdentityVerificationFailedActionsSchema,
  });

// identity_verification_manual_review
export const IdentityVerificationManualReviewNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('identity_verification_manual_review'),
    metadata: IdentityVerificationManualReviewMetadataSchema,
    actions: IdentityVerificationManualReviewActionsSchema,
  });

/**
 * Missing document refund notification schemas
 */

// seller_earnings_retained
export const SellerEarningsRetainedNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('seller_earnings_retained'),
    metadata: SellerEarningsRetainedMetadataSchema,
    actions: SellerEarningsRetainedActionsSchema,
  });

// buyer_ticket_cancelled
export const BuyerTicketCancelledNotificationSchema =
  BaseNotificationSchema.extend({
    type: z.literal('buyer_ticket_cancelled'),
    metadata: BuyerTicketCancelledMetadataSchema,
    actions: BuyerTicketCancelledActionsSchema,
  });

// order_invoice
export const OrderInvoiceNotificationSchema = BaseNotificationSchema.extend({
  type: z.literal('order_invoice'),
  metadata: OrderInvoiceMetadataSchema,
  actions: OrderInvoiceActionsSchema,
});

/**
 * Discriminated union of all notification types
 * Uses 'type' as the discriminator field for type safety
 * Reference: https://zod.dev/api?id=discriminated-unions
 */
export const NotificationSchema = z.discriminatedUnion('type', [
  TicketSoldSellerNotificationSchema,
  DocumentReminderNotificationSchema,
  OrderConfirmedNotificationSchema,
  OrderExpiredNotificationSchema,
  PaymentFailedNotificationSchema,
  PaymentSucceededNotificationSchema,
  DocumentUploadedNotificationSchema,
  DocumentUploadedBatchNotificationSchema,
  PayoutProcessingNotificationSchema,
  PayoutCompletedNotificationSchema,
  PayoutFailedNotificationSchema,
  PayoutCancelledNotificationSchema,
  // Auth notification types
  AuthVerificationCodeNotificationSchema,
  AuthResetPasswordCodeNotificationSchema,
  AuthInvitationNotificationSchema,
  AuthPasswordChangedNotificationSchema,
  AuthPasswordRemovedNotificationSchema,
  AuthPrimaryEmailChangedNotificationSchema,
  AuthNewDeviceSignInNotificationSchema,
  // Identity verification notification types
  IdentityVerificationCompletedNotificationSchema,
  IdentityVerificationRejectedNotificationSchema,
  IdentityVerificationFailedNotificationSchema,
  IdentityVerificationManualReviewNotificationSchema,
  // Missing document refund notification types
  SellerEarningsRetainedNotificationSchema,
  BuyerTicketCancelledNotificationSchema,
  OrderInvoiceNotificationSchema,
]);

/**
 * TypeScript type inferred from the discriminated union schema
 */
export type Notification = z.infer<typeof NotificationSchema>;

/**
 * Typed notification based on notification type
 * Extracts the specific notification type from the discriminated union
 */
export type TypedNotificationByType<T extends Notification['type']> = Extract<
  Notification,
  {type: T}
>;

/**
 * Actions array schema (generic, for backwards compatibility)
 */
export const NotificationActionsSchema = z.array(BaseActionSchema).nullable();
