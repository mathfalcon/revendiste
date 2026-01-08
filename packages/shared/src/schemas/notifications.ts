/**
 * Shared notification schemas
 *
 * These Zod schemas define the structure of notifications, metadata, and actions.
 * They are used by both backend and transactional packages for type safety.
 */

import {z} from 'zod';
import type {QrAvailabilityTiming, NotificationType} from '../types';

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
  hoursUntilEvent: z.number().int().positive(),
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
]);

/**
 * TypeScript type inferred from the discriminated union schema
 */
export type NotificationMetadata = z.infer<typeof NotificationMetadataSchema>;

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
      url: z.string().url().optional(),
    }),
  )
  .nullable();

// Actions for document_reminder - upload documents action
export const DocumentReminderActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('upload_documents'),
      label: z.string(),
      url: z.string().url(),
    }),
  )
  .nullable();

// Actions for order_confirmed - view order action
export const OrderConfirmedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_order'),
      label: z.string(),
      url: z.string().url(),
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
      url: z.string().url(),
    }),
  )
  .nullable();

// Actions for payment_succeeded - view order action
export const PaymentSucceededActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_order'),
      label: z.string(),
      url: z.string().url(),
    }),
  )
  .nullable();

// Actions for document_uploaded - view order action
export const DocumentUploadedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_order'),
      label: z.string(),
      url: z.string().url(),
    }),
  )
  .nullable();

// Actions for payout notifications - view payout action
export const PayoutProcessingActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_payout'),
      label: z.string(),
      url: z.string().url(),
    }),
  )
  .nullable();

export const PayoutCompletedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_payout'),
      label: z.string(),
      url: z.string().url(),
    }),
  )
  .nullable();

export const PayoutFailedActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_payout'),
      label: z.string(),
      url: z.string().url(),
    }),
  )
  .nullable();

export const PayoutCancelledActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('view_payout'),
      label: z.string(),
      url: z.string().url(),
    }),
  )
  .nullable();

/**
 * Auth notification action schemas
 * Auth emails are transactional and don't typically have actions stored
 */
export const AuthVerificationCodeActionsSchema = z.array(BaseActionSchema).nullable();
export const AuthResetPasswordCodeActionsSchema = z.array(BaseActionSchema).nullable();
export const AuthInvitationActionsSchema = z.array(BaseActionSchema).nullable();
export const AuthPasswordChangedActionsSchema = z.array(BaseActionSchema).nullable();
export const AuthPasswordRemovedActionsSchema = z.array(BaseActionSchema).nullable();
export const AuthPrimaryEmailChangedActionsSchema = z.array(BaseActionSchema).nullable();
export const AuthNewDeviceSignInActionsSchema = z.array(BaseActionSchema).nullable();

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
