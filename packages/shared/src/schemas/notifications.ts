/**
 * Shared notification schemas
 *
 * These Zod schemas define the structure of notifications, metadata, and actions.
 * They are used by both backend and transactional packages for type safety.
 */

import {z} from 'zod';
import type {
  QrAvailabilityTiming,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../types';

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

// ticket_sold_buyer
export const TicketSoldBuyerMetadataSchema = z.object({
  type: z.literal('ticket_sold_buyer'),
  orderId: z.uuid(),
  eventName: z.string(),
  ticketCount: z.number().int().positive(),
});

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
  totalAmount: z.string(),
  currency: z.string(),
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

/**
 * Discriminated union of all notification metadata types
 * Uses 'type' as the discriminator field for type safety
 */
export const NotificationMetadataSchema = z.discriminatedUnion('type', [
  TicketSoldBuyerMetadataSchema,
  TicketSoldSellerMetadataSchema,
  DocumentReminderMetadataSchema,
  OrderConfirmedMetadataSchema,
  OrderExpiredMetadataSchema,
  PaymentFailedMetadataSchema,
  PaymentSucceededMetadataSchema,
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

// Actions for ticket_sold (buyer) - upload documents action
export const TicketSoldBuyerActionsSchema = z
  .array(
    BaseActionSchema.extend({
      type: z.literal('upload_documents'),
      label: z.string(),
      url: z.string().url(),
    }),
  )
  .nullable();

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

/**
 * Individual notification schemas per type
 * Each extends the base schema and defines its own metadata and actions
 */

// ticket_sold_buyer
export const TicketSoldBuyerNotificationSchema = BaseNotificationSchema.extend({
  type: z.literal('ticket_sold_buyer'),
  metadata: TicketSoldBuyerMetadataSchema,
  actions: TicketSoldBuyerActionsSchema,
});

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

/**
 * Discriminated union of all notification types
 * Uses 'type' as the discriminator field for type safety
 * Reference: https://zod.dev/api?id=discriminated-unions
 */
export const NotificationSchema = z.discriminatedUnion('type', [
  TicketSoldBuyerNotificationSchema,
  TicketSoldSellerNotificationSchema,
  DocumentReminderNotificationSchema,
  OrderConfirmedNotificationSchema,
  OrderExpiredNotificationSchema,
  PaymentFailedNotificationSchema,
  PaymentSucceededNotificationSchema,
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
